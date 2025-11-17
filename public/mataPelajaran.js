// Search functionality untuk mata pelajaran
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.pelajaran-card');

    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();

                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    }

    // Card click handler
    cards.forEach(card => {
        const button = card.querySelector('.card-btn');
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const subject = card.querySelector('h3').textContent;
                alert(`Fitur pembelajaran untuk "${subject}" akan segera tersedia!`);
            });
        }
    });
});
