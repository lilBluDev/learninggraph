// Ulasan (Reviews) Page JavaScript

// Sample review data
const reviewsData = {
    semua: [
        {
            name: "Ayu Pratama",
            date: "15 November 2024",
            rating: 5,
            text: "LearningGraph sangat membantu saya dalam belajar matematika. Fitur-fiturnya user-friendly dan materi yang disajikan mudah dipahami. Sangat merekomendasikan untuk semua siswa!",
            badge: "Verified User"
        },
        {
            name: "Budi Santoso",
            date: "12 November 2024",
            rating: 5,
            text: "Platform pembelajaran terbaik yang pernah saya gunakan. Konten berkualitas tinggi dan cara penyampaiannya sangat efektif. Saya sudah merekomendasikan ke teman-teman saya.",
            badge: "Premium User"
        },
        {
            name: "Citra Dewi",
            date: "10 November 2024",
            rating: 4,
            text: "Sangat bagus, tapi perlu penambahan fitur chat live dengan tutor. Secara keseluruhan pengalaman belajar saya meningkat drastis. Terima kasih LearningGraph!",
            badge: "Active Learner"
        },
        {
            name: "Deni Kurniawan",
            date: "8 November 2024",
            rating: 4,
            text: "Platform yang solid dengan berbagai pilihan mata pelajaran. Interface-nya bagus dan navigasi mudah. Sedikit lag kadang tapi overall satisfied.",
            badge: "Verified User"
        },
        {
            name: "Eka Putri",
            date: "5 November 2024",
            rating: 5,
            text: "Luar biasa! Ini adalah platform pembelajaran yang saya cari-cari. Fitur gamification membuat saya lebih termotivasi untuk belajar setiap hari.",
            badge: "Top Performer"
        },
        {
            name: "Faisal Ahmad",
            date: "1 November 2024",
            rating: 3,
            text: "Cukup bagus, tapi harga berlangganannya sedikit mahal. Konten bagus tapi butuh lebih banyak video tutorial.",
            badge: "Verified User"
        }
    ]
};

// Filter reviews by rating
function filterReviews(rating) {
    if (rating === 'semua') {
        return reviewsData.semua;
    }
    return reviewsData.semua.filter(review => review.rating == rating);
}

// Render reviews
function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = '';

    reviews.forEach(review => {
        const stars = '⭐'.repeat(review.rating);
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-avatar">${review.name.charAt(0)}</div>
                <div class="review-user-info">
                    <div class="review-name">${review.name}</div>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
            <div class="review-rating">${stars}</div>
            <p class="review-text">${review.text}</p>
            <span class="review-badge">${review.badge}</span>
        `;
        container.appendChild(reviewCard);
    });
}

// Initialize filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        const filtered = filterReviews(filter);
        renderReviews(filtered);
    });
});

// Star rating interactive
const stars = document.querySelectorAll('.star');
const ratingValue = document.getElementById('ratingValue');

stars.forEach(star => {
    star.addEventListener('click', function() {
        const value = this.dataset.value;
        ratingValue.value = value;
        stars.forEach(s => {
            if (s.dataset.value <= value) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    });

    star.addEventListener('mouseover', function() {
        const value = this.dataset.value;
        stars.forEach(s => {
            if (s.dataset.value <= value) {
                s.style.color = '#ffc107';
            } else {
                s.style.color = '#ddd';
            }
        });
    });
});

document.getElementById('starRating').addEventListener('mouseleave', function() {
    stars.forEach(s => {
        if (s.classList.contains('active')) {
            s.style.color = '#ffc107';
        } else {
            s.style.color = '#ddd';
        }
    });
});

// Handle review form submission
document.getElementById('reviewForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('reviewName').value;
    const rating = document.getElementById('ratingValue').value;
    const text = document.getElementById('reviewText').value;

    if (!rating) {
        alert('Silakan pilih rating terlebih dahulu!');
        return;
    }

    // Add new review to the beginning
    const newReview = {
        name: name,
        date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
        rating: parseInt(rating),
        text: text,
        badge: "New Review"
    };

    reviewsData.semua.unshift(newReview);
    renderReviews(reviewsData.semua);

    // Reset form
    this.reset();
    ratingValue.value = 0;
    stars.forEach(s => s.classList.remove('active'));

    alert('Terima kasih atas ulasan Anda!');
});

// Initial render
renderReviews(reviewsData.semua);

// Update stats
document.getElementById('totalReviews').textContent = reviewsData.semua.length;
const avgRating = (reviewsData.semua.reduce((sum, r) => sum + r.rating, 0) / reviewsData.semua.length).toFixed(1);
document.getElementById('avgRating').textContent = avgRating;
