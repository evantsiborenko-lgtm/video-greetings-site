document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header height (approx 70px)
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. FAQ Accordion (Accessible)
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');

        questionBtn.addEventListener('click', () => {
            const isExpanded = questionBtn.getAttribute('aria-expanded') === 'true';

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq-question');
                    if (otherBtn) {
                        otherBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            // Toggle current item
            if (isExpanded) {
                item.classList.remove('active');
                questionBtn.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                questionBtn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // 4. Catalog Category Expansion
    const birthdayCatBtn = document.getElementById('cat-btn-birthday');
    const birthdayDetail = document.getElementById('catalog-detail-birthday');

    if (birthdayCatBtn && birthdayDetail) {
        birthdayCatBtn.addEventListener('click', () => {
            const isExpanded = birthdayCatBtn.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                birthdayCatBtn.setAttribute('aria-expanded', 'false');
                birthdayCatBtn.classList.remove('active');
                birthdayDetail.hidden = true;
            } else {
                birthdayCatBtn.setAttribute('aria-expanded', 'true');
                birthdayCatBtn.classList.add('active');
                birthdayDetail.hidden = false;
            }
        });
    }

    // 5. Catalog Series Accordion
    const seriesItems = document.querySelectorAll('.series-item');

    seriesItems.forEach(item => {
        const headerBtn = item.querySelector('.series-header');
        const content = item.querySelector('.series-content');

        if (headerBtn && content) {
            headerBtn.addEventListener('click', () => {
                const isExpanded = headerBtn.getAttribute('aria-expanded') === 'true';

                // Toggle current item
                if (isExpanded) {
                    item.classList.remove('active');
                    headerBtn.setAttribute('aria-expanded', 'false');
                    content.hidden = true;
                } else {
                    item.classList.add('active');
                    headerBtn.setAttribute('aria-expanded', 'true');
                    content.hidden = false;
                }
            });
        }
    });

});
