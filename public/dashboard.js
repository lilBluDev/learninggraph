// Dashboard page logic - fetch and display user data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            if (window.location.pathname.startsWith('/u/')) {
                window.location.href = '/daftarlogin';
                return;
            }
        }
        // Fetch user data from API
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (window.location.pathname.startsWith('/u/')) {
                window.location.href = '/daftarlogin';
                return;
            }
            throw new Error('Failed to fetch user');
        }
        const result = await response.json();
        const user = result.data || result;
        if (!user) {
            if (window.location.pathname.startsWith('/u/')) {
                window.location.href = '/daftarlogin';
                return;
            }
            throw new Error('No user data in response');
        }
        // Populate user name in composer
        updateComposerInfo(user);
        // Populate Level & XP Card
        populateLevelCard(user);
        // Populate Friends Card
        populateFriendsCard(user);
        // Populate Notifications Card
        populateNotificationsCard(user);
        // Setup post composer
        setupPostComposer(user);
        // Fetch and render post feed
        await fetchAndRenderFeed(user);
        // Update sidebar user card
        updateSidebarUserCard(user);
    } catch (error) {
        if (window.location.pathname.startsWith('/u/')) {
            window.location.href = '/daftarlogin';
            return;
        }
        console.error('[dashboard.js] Error fetching user data:', error);
        setDefaultValues();
    }
});

// Update composer with user info
function updateComposerInfo(user) {
    const composerAvatar = document.getElementById('composerAvatar');
    if (composerAvatar) composerAvatar.src = user.avatar ? user.avatar : '/public/defaultp.png';
}

// Populate Level & XP Card
function populateLevelCard(user) {
    console.log('[dashboard.js] populateLevelCard', user);
    const userLevel = document.getElementById('userLevel');
    const userLevelText = document.getElementById('userLevelText');
    const xpCurrent = document.getElementById('xpCurrent');
    const xpMax = document.getElementById('xpMax');
    const xpFill = document.getElementById('xpProgress');
    if (!userLevel || !userLevelText || !xpCurrent || !xpMax || !xpFill) {
        console.warn('[dashboard.js] Level card elements missing');
        return;
    }
    const level = user.level || 1;
    const xp = user.xp || 0;
    userLevel.textContent = level;
    userLevelText.textContent = level;
    const nextLevelXp = 100 * level;
    const currentLevelStartXp = 100 * (level - 1);
    const xpInCurrentLevel = xp - currentLevelStartXp;
    const xpNeeded = nextLevelXp - currentLevelStartXp;
    const xpPercentage = Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);
    xpCurrent.textContent = Math.max(xpInCurrentLevel, 0);
    xpMax.textContent = xpNeeded;
    xpFill.style.width = xpPercentage + '%';
    console.log('[dashboard.js] Level card updated');
}

// Populate Friends Card
function populateFriendsCard(user) {
    console.log('[dashboard.js] populateFriendsCard', user);
    const friendsCount = document.getElementById('friendsCount');
    const friendsText = document.getElementById('friendsText');
    if (!friendsCount || !friendsText) {
        console.warn('[dashboard.js] Friends card elements missing');
        return;
    }
    const friendsList = user.friends || [];
    const count = Array.isArray(friendsList) ? friendsList.length : 0;
    friendsCount.textContent = count;
    friendsText.textContent = count > 0 
        ? `You have ${count} friend${count !== 1 ? 's' : ''}`
        : 'No friends yet. Start making friends!';
    console.log('[dashboard.js] Friends card updated');
}

// Populate Notifications Card
function populateNotificationsCard(user) {
    console.log('[dashboard.js] populateNotificationsCard', user);
    const notificationsCount = document.getElementById('notificationsCount');
    const notificationsText = document.getElementById('notificationsText');
    if (!notificationsCount || !notificationsText) {
        console.warn('[dashboard.js] Notifications card elements missing');
        return;
    }
    const notifications = user.notifications || [];
    const count = Array.isArray(notifications) ? notifications.length : 0;
    notificationsCount.textContent = count;
    notificationsText.textContent = count > 0 
        ? `You have ${count} notification${count !== 1 ? 's' : ''}`
        : 'No new notifications';
    console.log('[dashboard.js] Notifications card updated');
}

// Set default values on error
function setDefaultValues() {
    document.getElementById('userLevel').textContent = '1';
    document.getElementById('userLevelText').textContent = '1';
    document.getElementById('xpCurrent').textContent = '0';
    document.getElementById('xpMax').textContent = '100';
    document.getElementById('xpProgress').style.width = '0%';
    document.getElementById('friendsCount').textContent = '0';
    document.getElementById('friendsText').textContent = 'Unable to load friends';
    document.getElementById('notificationsCount').textContent = '0';
    document.getElementById('notificationsText').textContent = 'Unable to load notifications';
    const composerAvatar = document.getElementById('composerAvatar');
    if (composerAvatar) composerAvatar.src = '/public/defaultp.png';
}

// --- Post Composer and Feed Logic ---
function setupPostComposer(user) {
    const postInput = document.getElementById('postInput');
    const postBtn = document.getElementById('postBtn');
    const feedContainer = document.getElementById('feedContainer');
    const composerAvatar = document.getElementById('composerAvatar');
    if (composerAvatar) composerAvatar.src = user.avatar ? user.avatar : '/public/defaultp.png';

    // Enable/disable post button based on input
    postInput.addEventListener('input', () => {
        postBtn.disabled = postInput.value.trim().length === 0;
    });

    // Handle post submission
    postBtn.addEventListener('click', async () => {
        const content = postInput.value.trim();
        if (!content) return;

        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                const result = await response.json();
                const post = result.post || result; // Support both {post} and direct
                postInput.value = '';
                postBtn.disabled = true;
                postBtn.textContent = 'Post';
                addPostToFeed(post, user);
            }
        } catch (error) {
            console.error('[dashboard.js] Error posting:', error);
            postBtn.textContent = 'Failed to post';
            setTimeout(() => {
                postBtn.textContent = 'Post';
                postBtn.disabled = false;
            }, 2000);
        }
    });

    // Initialize with disabled button
    postBtn.disabled = true;
}

// Fetch all posts and render feed
async function fetchAndRenderFeed(currentUser) {
    const feedContainer = document.getElementById('feedContainer');
    feedContainer.innerHTML = '<p class="empty-feed">Loading posts...</p>';
    try {
        const response = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch posts');
        const result = await response.json();
        const posts = result.posts || result; // Support both {posts} and direct
        feedContainer.innerHTML = '';
        if (!posts.length) {
            feedContainer.innerHTML = '<p class="empty-feed">No posts yet. Be the first to share!</p>';
        } else {
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            posts.forEach(post => renderPostItem(post, currentUser));
        }
    } catch (err) {
        feedContainer.innerHTML = '<p class="empty-feed">Failed to load posts.</p>';
        console.error('[dashboard.js] Error loading posts:', err);
    }
}

function addPostToFeed(post, user) {
    // Add a new post to the top of the feed
    renderPostItem(post, user, true);
}

// Render a single post item
function renderPostItem(post, currentUser, prepend = false) {
    const feedContainer = document.getElementById('feedContainer');
    const emptyMessage = feedContainer.querySelector('.empty-feed');
    if (emptyMessage) emptyMessage.remove();

    // Author info
    const author = post.author || {};
    const isAuthor = currentUser && (author._id === currentUser._id || author.username === currentUser.username);
    const avatarUrl = author.avatar ? author.avatar : '/public/defaultp.png';
    const displayName = author.displayName || author.name || 'User';
    const username = author.username || 'user';
    const timeAgo = timeSince(new Date(post.createdAt || Date.now()));

    // Like/dislike state
    const liked = post.likes && currentUser && post.likes.includes(currentUser._id);
    const disliked = post.dislikes && currentUser && post.dislikes.includes(currentUser._id);
    const likeCount = post.likes ? post.likes.length : 0;
    const dislikeCount = post.dislikes ? post.dislikes.length : 0;

    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    postElement.innerHTML = `
        <div class="post-header">
            <img src="${avatarUrl ? avatarUrl : "/public/defaultp.png"}" alt="Avatar" class="post-avatar">
            <div class="post-author-info">
                <p class="post-author-name">${displayName}</p>
                <p class="post-author-handle">@${username}</p>
            </div>
            <span class="post-time">${timeAgo}</span>
            ${isAuthor ? `<div class="post-actions">
                <button class="edit-post-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-post-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>` : ''}
        </div>
        <p class="post-content">${escapeHtml(post.content)}</p>
        <div class="post-stats">
            <button class="like-btn${liked ? ' liked' : ''}" title="Like"><i class="fas fa-heart"></i> <span class="like-count">${likeCount}</span></button>
            <button class="dislike-btn${disliked ? ' disliked' : ''}" title="Dislike"><i class="fas fa-thumbs-down"></i> <span class="dislike-count">${dislikeCount}</span></button>
        </div>
    `;
    // Like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            await handleLikeDislike(post._id, 'like', currentUser, postElement);
        });
    }
    // Dislike button
    const dislikeBtn = postElement.querySelector('.dislike-btn');
    if (dislikeBtn) {
        dislikeBtn.addEventListener('click', async () => {
            await handleLikeDislike(post._id, 'dislike', currentUser, postElement);
        });
    }
    // Edit button
    const editBtn = postElement.querySelector('.edit-post-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            handleEditPost(post, postElement, currentUser);
        });
    }
    // Delete button
    const deleteBtn = postElement.querySelector('.delete-post-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            handleDeletePost(post._id, postElement);
        });
    }
    if (prepend) {
        feedContainer.insertBefore(postElement, feedContainer.firstChild);
    } else {
        feedContainer.appendChild(postElement);
    }
}

// Like/dislike handler
async function handleLikeDislike(postId, action, currentUser, postElement) {
    try {
        const response = await fetch(`/api/posts/${postId}/${action}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to ' + action);
        const updated = await response.json();
        // Update like/dislike counts and button states
        const likeBtn = postElement.querySelector('.like-btn');
        const dislikeBtn = postElement.querySelector('.dislike-btn');
        if (likeBtn) {
            likeBtn.classList.toggle('liked', updated.likes.includes(currentUser._id));
            likeBtn.querySelector('.like-count').textContent = updated.likes.length;
        }
        if (dislikeBtn) {
            dislikeBtn.classList.toggle('disliked', updated.dislikes.includes(currentUser._id));
            dislikeBtn.querySelector('.dislike-count').textContent = updated.dislikes.length;
        }
    } catch (err) {
        alert('Failed to ' + action + ' post.');
    }
}

// Edit post handler
function handleEditPost(post, postElement, currentUser) {
    const contentP = postElement.querySelector('.post-content');
    if (!contentP) return;
    // Replace with textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-post-textarea';
    textarea.value = post.content;
    contentP.replaceWith(textarea);
    textarea.focus();
    // Add save/cancel buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-actions';
    actionsDiv.innerHTML = `
        <button class="save-edit-btn">Save</button>
        <button class="cancel-edit-btn">Cancel</button>
    `;
    textarea.after(actionsDiv);
    // Save
    actionsDiv.querySelector('.save-edit-btn').addEventListener('click', async () => {
        const newContent = textarea.value.trim();
        if (!newContent) return alert('Content cannot be empty.');
        try {
            const response = await fetch(`/api/posts/${post._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: newContent })
            });
            if (!response.ok) throw new Error('Failed to update post');
            post.content = newContent;
            textarea.replaceWith(contentP);
            contentP.textContent = escapeHtml(newContent);
            actionsDiv.remove();
        } catch (err) {
            alert('Failed to update post.');
        }
    });
    // Cancel
    actionsDiv.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        textarea.replaceWith(contentP);
        actionsDiv.remove();
    });
}

// Delete post handler
async function handleDeletePost(postId, postElement) {
    if (!confirm('Delete this post?')) return;
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete post');
        postElement.remove();
    } catch (err) {
        alert('Failed to delete post.');
    }
}

// Time ago utility
function timeSince(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + 'y ago';
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + 'mo ago';
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + 'd ago';
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + 'h ago';
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + 'm ago';
    return 'just now';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Update sidebar user card with fetched user data
function updateSidebarUserCard(user) {
    const avatar = document.querySelector('.sidebar .avatar');
    const name = document.querySelector('.sidebar .user-name');
    const username = document.querySelector('.sidebar .user-username');
    const email = document.querySelector('.sidebar .user-email');
    if (avatar) avatar.src = user.avatar ? user.avatar : '/public/defaultp.png';
    if (name && (user.displayName || user.name)) name.textContent = user.displayName || user.name;
    if (username && user.username) username.textContent = '@' + user.username;
    if (email && user.email) email.textContent = user.email;
}
