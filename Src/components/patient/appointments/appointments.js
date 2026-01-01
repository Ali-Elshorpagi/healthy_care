document.addEventListener('DOMContentLoaded', function () {
  buildHeader();
  buildSidebar('appointments');
  setupFilters();
  setupBookBtn();
});

function setupFilters() {
  let tabs = document.querySelectorAll('.filter-tab');
  let cards = document.querySelectorAll('.appointment-card');
  let empty = document.getElementById('emptyState');
  let list = document.getElementById('appointmentsList');

  for (let i = 0; i < tabs.length; i++) {
    tabs[i].onclick = function () {
      for (let j = 0; j < tabs.length; j++) {
        tabs[j].className = 'filter-tab';
      }
      this.className = 'filter-tab active';

      let filter = this.getAttribute('data-filter');
      let visible = 0;

      for (let k = 0; k < cards.length; k++) {
        let status = cards[k].getAttribute('data-status');
        if (filter === 'all' || status === filter) {
          cards[k].style.display = 'table';
          visible++;
        } else {
          cards[k].style.display = 'none';
        }
      }

      if (visible === 0) {
        list.style.display = 'none';
        empty.className = 'empty-state';
      } else {
        list.style.display = 'block';
        empty.className = 'empty-state hidden';
      }
    };
  }
}

function setupBookBtn() {
  let btn = document.getElementById('bookBtn');
  if (btn) {
    btn.onclick = function (e) {
      e.preventDefault();
      alert('Book appointment feature coming soon!');
    };
  }
}
