document.addEventListener('DOMContentLoaded', function () {
  buildHeader();
  buildSidebar('medical-records');
  setupSearch();
  setupFilter();
});

function setupSearch() {
  let input = document.getElementById('searchInput');
  if (!input) return;

  input.onkeyup = function () {
    filterRecords();
  };
}

function setupFilter() {
  let select = document.getElementById('typeFilter');
  if (!select) return;

  select.onchange = function () {
    filterRecords();
  };
}

function filterRecords() {
  let query = document.getElementById('searchInput').value.toLowerCase();
  let type = document.getElementById('typeFilter').value;
  let items = document.querySelectorAll('.record-item');
  let sections = document.querySelectorAll('.doctor-section');
  let empty = document.getElementById('emptyState');
  let list = document.getElementById('recordsList');
  let totalVisible = 0;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let title = item.querySelector('.list-title').textContent.toLowerCase();
    let itemType = item.getAttribute('data-type');
    let show = true;

    if (query && title.indexOf(query) === -1) {
      show = false;
    }
    if (type && itemType !== type) {
      show = false;
    }

    item.style.display = show ? 'table' : 'none';
    if (show) totalVisible++;
  }

  for (let j = 0; j < sections.length; j++) {
    let section = sections[j];
    let visibleItems = section.querySelectorAll(
      '.record-item[style="display: table;"]'
    );
    let hasVisible = false;
    let sectionItems = section.querySelectorAll('.record-item');
    for (let k = 0; k < sectionItems.length; k++) {
      if (sectionItems[k].style.display !== 'none') {
        hasVisible = true;
        break;
      }
    }
    section.style.display = hasVisible ? 'block' : 'none';
  }

  if (totalVisible === 0) {
    list.style.display = 'none';
    empty.className = 'empty-state';
  } else {
    list.style.display = 'block';
    empty.className = 'empty-state hidden';
  }
}
