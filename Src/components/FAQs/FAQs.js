// FAQ Manager - Module Pattern
let FAQManager = (function() {
    let faqs = [];
    let searchQuery = '';
    let API_BASE = 'http://localhost:3000';
    let currentUserEmail = null;

    async function init() {
        currentUserEmail = getUserEmail();
        await loadFAQs();
        setupEventListeners();
        setupModalHandlers();
        renderFAQs();
    }

    function getUserEmail() {
        let sessionEmail = sessionStorage.getItem('email');
        if (sessionEmail) return sessionEmail;
        
        let cookieEmail = getCookie('email');
        return cookieEmail || null;
    }

    function getCookie(name) {
        let matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    async function loadFAQs() {
        try {
            let response = await fetch(`${API_BASE}/faqs`);
            if (!response.ok) throw new Error('Failed to load FAQs');
            faqs = await response.json();
            if (!Array.isArray(faqs)) faqs = [];
        } catch (error) {
            console.error('Error loading FAQs:', error);
            faqs = [];
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
            let question = questionInput.value.trim();

            if (!question) {
                alert('Please enter a question');
                return;
            }

            let newFAQ = {
                userId: currentUserEmail || 'anonymous',
                category: 'General',
                question: question,
                answer: '',
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            saveFAQToDatabase(newFAQ);
            showSuccessMessage('Question submitted successfully!');
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

    function filterFAQs() {
        return faqs.filter(function(faq) {
            let isAnswered = faq.answer && faq.answer.trim() !== '';
            let isOwnQuestion = currentUserEmail && faq.userId === currentUserEmail;
            
            if (!isAnswered && !isOwnQuestion) return false;
            
            return searchQuery === '' || 
                faq.question.toLowerCase().includes(searchQuery) ||
                (faq.answer && faq.answer.toLowerCase().includes(searchQuery));
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

    function createFAQElement(faq) {
        let faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.dataset.id = faq.id;

        let isPending = !faq.answer || faq.answer.trim() === '';
        let highlightedQuestion = highlightText(faq.question, searchQuery);
        let highlightedAnswer = isPending 
            ? 'Your question is pending review. We\'ll answer it soon!' 
            : highlightText(faq.answer, searchQuery);

        faqItem.innerHTML = `
            <button class="faq-question" aria-expanded="false">
                <span>${highlightedQuestion}${isPending ? ' <em>(Pending)</em>' : ''}</span>
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

    async function saveFAQToDatabase(faq) {
        try {
            let response = await fetch(`${API_BASE}/faqs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(faq)
            });
            
            if (!response.ok) throw new Error('Failed to save FAQ');
            
            let savedFAQ = await response.json();
            faqs.push(savedFAQ);
            renderFAQs();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            alert('Failed to save question. Make sure the server is running.');
        }
    }

    // Public methods
    return {
        init: init
    };
})();
FAQManager.init();

