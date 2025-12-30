// FAQ Manager - Module Pattern
let FAQManager = (function() {
    let faqs = [];
    let searchQuery = '';

    async function init() {
        await loadFAQs();
        setupEventListeners();
        setupModalHandlers();
        renderFAQs();
    }

    // Load FAQs from JSON file
    async function loadFAQs() {
        try {
            let localFAQs = loadFAQsFromLocalStorage();
            let response = await fetch('data/FAQs.json');
            let data = await response.json();
            
            if (localFAQs && localFAQs.length > 0) {
                let jsonIds = data.faqs.map(function(faq) {
                    return faq.id;
                });
                let newLocalFAQs = localFAQs.filter(function(faq) {
                    return !jsonIds.includes(faq.id);
                });
                faqs = [...data.faqs, ...newLocalFAQs];
            } else {
                faqs = data.faqs;
            }
        } catch (error) {
            console.error('Error loading FAQs:', error);
            let localFAQs = loadFAQsFromLocalStorage();
            faqs = localFAQs || [];
        }
    }

    function setupEventListeners() {
        let searchInput = document.getElementById('searchInput');
        let searchBtn = document.getElementById('searchBtn');

        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value.toLowerCase();
            renderFAQs();
        });

        searchBtn.addEventListener('click', function() {
            searchQuery = searchInput.value.toLowerCase();
            renderFAQs();
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.toLowerCase();
                renderFAQs();
            }
        });
    }

    function setupModalHandlers() {
        let modal = document.getElementById('addQuestionModal');
        let contactBtn = document.getElementById('contactSupportBtn');
        let closeBtn = document.getElementById('closeModal');
        let cancelBtn = document.getElementById('cancelBtn');
        let form = document.getElementById('addQuestionForm');

        contactBtn.addEventListener('click', function() {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            form.reset();
        }

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let questionInput = document.getElementById('questionInput');

            let newFAQ = {
                id: Date.now(),
                category: 'General',
                question: questionInput.value.trim(),
                answer: 'Thank you for your question! Our support team will respond shortly.',
                isExpanded: false
            };

            faqs.push(newFAQ);
            saveFAQsToLocalStorage();
            showSuccessMessage('Question submitted successfully!');
            renderFAQs();
            closeModal();
        });
    }

    // Show success message
    function showSuccessMessage(message) {
        let successBanner = document.getElementById('successBanner');
        if (!successBanner) {
            successBanner = document.createElement('div');
            successBanner.id = 'successBanner';
            successBanner.className = 'success-message';
            document.querySelector('.faq-content .container').insertBefore(
                successBanner,
                document.querySelector('.category-tabs')
            );
        }

        successBanner.textContent = message;
        successBanner.classList.add('active');

        setTimeout(function() {
            successBanner.classList.remove('active');
        }, 3000);
    }

    // Filter FAQs based on search query
    function filterFAQs() {
        return faqs.filter(function(faq) {
            return searchQuery === '' || 
                faq.question.toLowerCase().includes(searchQuery) ||
                faq.answer.toLowerCase().includes(searchQuery);
        });
    }

    // Render FAQs to the DOM
    function renderFAQs() {
        let accordion = document.getElementById('faqAccordion');
        let noResults = document.getElementById('noResults');
        let filteredFAQs = filterFAQs();

        accordion.innerHTML = '';

        if (filteredFAQs.length === 0) {
            noResults.style.display = 'block';
            accordion.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            accordion.style.display = 'flex';

            filteredFAQs.forEach(function(faq) {
                let faqItem = createFAQElement(faq);
                accordion.appendChild(faqItem);
            });
        }
    }

    // Create FAQ element
    function createFAQElement(faq) {
        let faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.dataset.id = faq.id;

        let highlightedQuestion = highlightText(faq.question, searchQuery);
        let highlightedAnswer = highlightText(faq.answer, searchQuery);

        faqItem.innerHTML = `
            <button class="faq-question" aria-expanded="false">
                <span>${highlightedQuestion}</span>
                <span class="icon">▼</span>
            </button>
            <div class="faq-answer">
                <p>${highlightedAnswer}</p>
            </div>
        `;

        let questionBtn = faqItem.querySelector('.faq-question');
        questionBtn.addEventListener('click', function() {
            toggleFAQ(faqItem, questionBtn);
        });

        return faqItem;
    }

    // Toggle FAQ accordion
    function toggleFAQ(faqItem, questionBtn) {
        let isExpanded = faqItem.classList.contains('expanded');
        
        if (isExpanded) {
            faqItem.classList.remove('expanded');
            questionBtn.setAttribute('aria-expanded', 'false');
        } 
        else {
            document.querySelectorAll('.faq-item.expanded').forEach(function(item) {
                item.classList.remove('expanded');
                item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            
            faqItem.classList.add('expanded');
            questionBtn.setAttribute('aria-expanded', 'true');
        }
    }

    // Highlight search terms in text
    function highlightText(text, searchQuery) {
        if (!searchQuery) return text;
        return text;
    }

    // Save FAQs to localStorage
    function saveFAQsToLocalStorage() {
        try {
            localStorage.setItem('healthycare_faqs', JSON.stringify({ faqs: faqs }));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load FAQs from localStorage
    function loadFAQsFromLocalStorage() {
        try {
            let stored = localStorage.getItem('healthycare_faqs');
            if (stored) {
                let data = JSON.parse(stored);
                return data.faqs;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return null;
    }

    // Public methods
    return {
        init: init
    };
})();
FAQManager.init();

