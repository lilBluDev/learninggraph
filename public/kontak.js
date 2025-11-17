// Kontak (Contact) Page JavaScript

// Handle contact form submission
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    const formStatus = document.getElementById('formStatus');

    try {
        // In a real application, you would send this to your backend API
        // For now, we'll simulate a successful submission
        
        // Optional: Send to backend API
        // const response = await fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ name, email, phone, subject, message })
        // });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success message
        formStatus.textContent = '✓ Pesan Anda telah terkirim! Kami akan membalas dalam 24 jam.';
        formStatus.className = 'form-status success';

        // Log the data (for debugging)
        console.log('Contact Form Data:', {
            name, email, phone, subject, message,
            timestamp: new Date().toISOString()
        });

        // Reset form
        this.reset();

        // Hide message after 5 seconds
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);

    } catch (error) {
        formStatus.textContent = '✗ Gagal mengirim pesan. Silakan coba lagi.';
        formStatus.className = 'form-status error';
        console.error('Error:', error);
    }
});

// Optional: Add input validation
document.getElementById('contactEmail').addEventListener('blur', function() {
    if (this.value && !this.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        this.style.borderColor = '#f8d7da';
    } else {
        this.style.borderColor = '#e0e0e0';
    }
});

document.getElementById('contactPhone').addEventListener('blur', function() {
    if (this.value && !this.value.match(/^[\d\-+()]{7,}$/)) {
        this.style.borderColor = '#f8d7da';
    } else {
        this.style.borderColor = '#e0e0e0';
    }
});
