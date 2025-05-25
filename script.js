document.addEventListener('DOMContentLoaded', function() {
    // Main section collapsible functionality
    document.querySelectorAll('.doc-section h1').forEach(header => {
        header.addEventListener('click', function() {
            const section = this.closest('.doc-section');
            section.classList.toggle('collapsed');
        });
    });

    // Component section collapsible functionality
    document.querySelectorAll('.component-section h2').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering parent section collapse
            const section = this.closest('.component-section');
            section.classList.toggle('collapsed');
        });
    });

    // Subcategory collapsible functionality for both installation steps and manual content
    document.querySelectorAll('.installation-steps h3, .installation-steps h4, .manual-content h3, .manual-content h4').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering parent section collapse
            this.classList.toggle('collapsed');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('sub-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });

    // Language selector functionality
    const languageSelect = document.getElementById('languageSelect');
    const originalTexts = new Map();
    const originalIcons = new Map();

    // Store original texts and icons
    document.querySelectorAll('h1, h2, h3, h4, p, li, span:not(.logo span)').forEach(element => {
        // Skip elements that contain pre or a tags
        if (!element.querySelector('pre') && !element.querySelector('a') && element.textContent.trim()) {
            originalTexts.set(element, element.textContent);
            
            // Store icons if present
            const icons = element.querySelectorAll('i.fas');
            if (icons.length > 0) {
                originalIcons.set(element, Array.from(icons).map(icon => icon.outerHTML));
            }
        }
    });

    // Function to translate text
    async function translateText(text, targetLang) {
        if (targetLang === 'en') return text;
        
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
            const data = await response.json();
            
            // Check for API limit error
            if (data.responseStatus === 403 || data.responseStatus === 429) {
                console.warn('Translation API limit reached');
                throw new Error('Translation service is temporarily unavailable');
            }
            
            return data.responseData.translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }

    // Function to show notification
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 15px 25px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
            text-align: center;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Handle language change
    languageSelect.addEventListener('change', async function() {
        const targetLang = this.value;
        const elements = Array.from(originalTexts.keys());
        
        // Show loading state
        elements.forEach(element => {
            element.style.opacity = '0.5';
        });

        showNotification('Translating content...');

        try {
            // Translate all elements in parallel
            const translations = await Promise.all(
                elements.map(async (element) => {
                    const originalText = originalTexts.get(element);
                    const translatedText = targetLang === 'en' ? 
                        originalText : 
                        await translateText(originalText, targetLang);
                    return { element, translatedText };
                })
            );

            // Apply translations and restore icons
            translations.forEach(({ element, translatedText }) => {
                element.textContent = translatedText;
                
                // Restore icons if they existed
                if (originalIcons.has(element)) {
                    const icons = originalIcons.get(element);
                    icons.forEach(icon => {
                        element.insertAdjacentHTML('afterbegin', icon);
                    });
                }
                
                element.style.opacity = '1';
            });

            showNotification('Translation complete');
        } catch (error) {
            console.error('Translation failed:', error);
            
            // Show error notification
            if (error.message === 'Translation service is temporarily unavailable') {
                showNotification('Translation service is temporarily unavailable. Please try again later.', true);
            } else {
                showNotification('Failed to translate content. Please try again.', true);
            }
            
            // Restore original text and icons
            elements.forEach(element => {
                element.textContent = originalTexts.get(element);
                
                // Restore icons if they existed
                if (originalIcons.has(element)) {
                    const icons = originalIcons.get(element);
                    icons.forEach(icon => {
                        element.insertAdjacentHTML('afterbegin', icon);
                    });
                }
                
                element.style.opacity = '1';
            });

            // Reset language selector to English
            languageSelect.value = 'en';
        }
    });

    // Add copy button to all pre elements
    const preElements = document.querySelectorAll('pre');
    preElements.forEach(pre => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy to clipboard';
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);

        copyButton.addEventListener('click', async () => {
            const code = pre.textContent.replace('Copy', '').trim();
            try {
                await navigator.clipboard.writeText(code);
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Google Translate initialization
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,es,fr,de,it,pt',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

// Function to change language
function changeLanguage(lang) {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
    }
} 