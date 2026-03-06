class VideoStoryPlayer {
    constructor(options = {}) {
        // --- 1. SETUP DATA & GROUPING ---
        this.targetElement = options.target || document.body;
        this.triggerGroup = options.triggerGroup;
        
        this.allGroups = Array.from(document.querySelectorAll('[data-story-group]'));
        this.currentGroupIndex = this.allGroups.indexOf(this.triggerGroup);
        
        this.items = Array.from(this.triggerGroup.querySelectorAll('[data-story-item]'));
        this.currentNestedIndex = options.nestedIndex || 0;
        
        if (this.currentNestedIndex >= this.items.length) this.currentNestedIndex = 0;
        this.currentItem = this.items[this.currentNestedIndex];

        this.data = {
            format: this.triggerGroup.getAttribute('data-story-format') || "default",
            id: this.currentItem.getAttribute('data-story-id') || "",
            nid: this.currentItem.getAttribute('data-story-nid') || "",
            type: this.currentItem.getAttribute('data-story-type') || "youtube", 
            videoUrl: this.currentItem.getAttribute('data-story-url') || "",
            title: this.currentItem.getAttribute('data-story-title') || "",
            views: this.currentItem.getAttribute('data-story-views') || "0",
            content: this.currentItem.getAttribute('data-story-desc-content') || "",
            readMoreText: this.currentItem.getAttribute('data-story-readmore') || "Selengkapnya",
            onClose: options.onClose
        };

        // --- 2. STATE ANIMASI & EVENT BINDING ---
        this.isPaused = false;
        this.currentAnimationFrame = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.imageDuration = 5000;

        this.handleKeydown = this.handleKeydown.bind(this);
        this.init();
    }

    init() {
        document.querySelectorAll('.video-player-container').forEach(el => el.remove());

        this.addOverlayStyles();
        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.updateButtonState();
        this.updateURLWithVideoId();
        
        if (this.shareMenuDesktop) this.shareMenuDesktop.style.display = 'none';

        if (this.data.format === 'webstory') {
            this.startMediaProgress();
            this.initTouchSwipeWebStory();
        } else {
            if (window.innerWidth <= 768) {
                this.initTouchHandlingDefault();
            }
        }
    }

    getYouTubeId(url) {
        const match = url.match(/^.*(youtu.be\/|youtube.com\/(watch\?v=|embed\/|shorts\/))([^#\&\?]*).*/);
        return (match && match[3].length > 0) ? match[3] : url;
    }

    getVideoElement() {
        const { type, videoUrl } = this.data;
        if (type === "youtube") {
            const youtubeId = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? this.getYouTubeId(videoUrl) : videoUrl;
            return `<iframe loading="lazy" class="video-element" src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0&showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else if (type === "mp4") {
            return `<video class="web-story-element video-element" id="mediaPlayer" autoplay playsinline>
                        <source src="${videoUrl}" type="video/mp4">
                    </video>`;
        } else if (type === "image") {
            return `<img class="web-story-element web-story-img" id="mediaPlayer" src="${videoUrl}" alt="Story Image">`;
        } else {
            return `<iframe loading="lazy" class="video-element" src="${videoUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        }
    }

    renderProgressBars() {
        let barsHtml = '';
        for (let i = 0; i < this.items.length; i++) {
            let fillClass = i < this.currentNestedIndex ? 'width: 100%;' : 'width: 0%;';
            let activeClass = i === this.currentNestedIndex ? 'active' : '';
            barsHtml += `<div class="progress-bar-segment ${activeClass}"><div class="progress-fill" style="${fillClass}"></div></div>`;
        }
        return barsHtml;
    }

    getTemplate() {
        const currentUrl = window.location.origin + window.location.pathname + "?video=" + this.data.id;
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedTitle = encodeURIComponent(this.data.title);

        if (this.data.format === 'webstory') {
            let dynamicStyle = "";
            if (window.innerWidth >= 768) {
                const widthVal = this.data.type === "image" ? "308px" : "350px";
                dynamicStyle = `width: ${widthVal}; margin-inline: auto; left: 0; right: 0;`;
            }

            return `
                <div class="video-player-container web-story-container">
                    <div class="close-btn-story close-button">×</div>
                    
                    <div class="progress-bar-container" style="${dynamicStyle}">${this.renderProgressBars()}</div>
                    
                    <div class="web-story" style="${dynamicStyle}">
                        <div class="video-container-story">
                            ${this.getVideoElement()}
                            <div class="controls">
                                <button id="playPauseButton" class="control-button"><img id="playPauseIcon" src="/themes/custom/telkomsel/assets/img/revamp/pause.svg"></button>
                                <button id="muteButton" class="control-button"><img id="muteIcon" src="/themes/custom/telkomsel/assets/img/revamp/sound.svg"></button>
                            </div>
                        </div>
                        <div class="touch-overlay left-overlay"></div>
                        <div class="touch-overlay center-overlay"></div>
                        <div class="touch-overlay right-overlay"></div>
                    </div>

                    <div class="story-video-info" style="${dynamicStyle}">
                        <h3>${this.data.title}</h3>
                        <div class="content-story-desc">${this.data.content}</div>
                    </div>

                    <div class="video-controls-scroll">
                        <div class="scroll-btn" id="scrollUp"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_chevron_up.svg" loading="lazy"></div>
                        <div class="scroll-btn" id="scrollDown"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_chevron_down.svg" loading="lazy"></div>
                    </div>
                </div>
            `;
        }

        // === PERBAIKAN ZONA MATI YOUTUBE ===
        // Hanya buat overlay pelindung sentuhan jika di device HP (width <= 768)
        let touchOverlaysDefault = '';
        if (window.innerWidth <= 768) {
            touchOverlaysDefault = `
                <div class="touch-overlay top-overlay"></div>
                <div class="touch-overlay left-overlay"></div>
                <div class="touch-overlay right-overlay"></div>
            `;
        }

        return `
            <div class="video-player-container">
                <div class="close-button">×</div>
                <div class="video-player">
                    ${this.getVideoElement()}
                    ${touchOverlaysDefault} </div>
                
                <div class="fullscreen-video-info" id="mobile-video-info">
                    <h3>${this.data.title}</h3>
                    <div class="content-desc" id="section-content-description">${this.data.content}</div>
                </div>

                <div class="section-media">
                    <div class="section-media-wrapper">
                        <div class="content">
                            <p>${this.data.title}</p>
                            <div class="view-content"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_eye_open.svg"><div class="view-content-number">${this.data.views}</div></div>
                            <div class="desc-content desktop-desc">${this.data.content}</div>
                            <a href="#" class="read-more-section">${this.data.readMoreText}</a>
                        </div>
                        <div class="content-footer">
                            <div class="content-outer-card">
                                <div class="emote"><div class="emote-icon-sad">😭</div><div class="emote-icon-clap">👏🏻</div><div class="emote-icon-laugh">🤣</div><div class="emote-icon-celebrate">🎉</div><div class="emote-icon-heart">❤️</div></div>
                                <div class="btn-share"><button class="button-primary-global" id="btn-share-social-desktop">Bagikan</button></div>
                            </div>
                            <div class="share-link" id="share-link-media-desktop">
                                <div class="title-link">Bagikan Dengan yang lain</div>
                                <div class="share-icon-social-media">
                                    <div class="icon-social"><a href="https://api.whatsapp.com/send?text=${encodedUrl}" target="_blank"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/whatsapp.svg"></a><span>Whatsapp</span></div>
                                    <div class="icon-social"><a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/telegram.svg"></a><span>Telegram</span></div>
                                    <div class="icon-social copy-link"><div data-url="${currentUrl}"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/link.svg"></div><span>Copy Link</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="video-controls-scroll">
                    <div class="scroll-btn" id="scrollUp"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_chevron_up.svg"></div>
                    <div class="scroll-btn" id="scrollDown"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_chevron_down.svg"></div>
                </div>

                <div class="dialog-video-description"><div class="popup-video-shorts popup-shorts-overlay"></div><div class="popup-shorts popup-shorts-content"><div class="popup-shorts-inner"><div class="popup-shorts-inner-content"><div class="body-content"><div class="card-info"><div class="stick-close" id="closedescription"></div><div class="section-media-wrapper"><div class="content"><p>${this.data.title}</p><div class="view-content"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/ico_eye_open.svg"><div class="view-content-number">${this.data.views}</div></div><div class="desc-content mobile-desc-content">${this.data.content}</div><a href="#" class="read-more-section">Selengkapnya</a></div><div class="content-footer"><div class="content-outer-card"><div class="emote"><div class="emote-icon-sad">😭</div><div class="emote-icon-clap">👏🏻</div><div class="emote-icon-laugh">🤣</div><div class="emote-icon-celebrate">🎉</div><div class="emote-icon-heart">❤️</div></div><div class="btn-share"><button class="button-primary-global" id="btn-share-mobile">Bagikan</button></div></div></div></div></div></div></div></div></div></div>
                <div class="dialog-video-share"><div class="popup-video-share popup-share-overlay"></div><div class="popup-share popup-share-content"><div class="popup-share-inner"><div class="popup-share-inner-content"><div class="body-content"><div class="card-info"><div class="stick-close" id="closedescriptionShare">×</div><div class="section-media-wrapper share"><div class="content-footer content-footer-share"><div class="share-link" id="share-link-media"><div class="title-link title-link-share">Bagikan Dengan yang lain</div><div class="share-icon-social-media"><div class="icon-social"><a href="https://api.whatsapp.com/send?text=${encodedUrl}" target="_blank"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/whatsapp.svg"></a><span>Whatsapp</span></div><div class="icon-social"><a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/telegram.svg"></a><span>Telegram</span></div><div class="icon-social copy-link"><div data-url="${currentUrl}"><img src="/themes/custom/telkomsel/assets/img/revamp/icons/social/link.svg"></div><span>Copy Link</span></div></div></div></div></div></div></div></div></div></div></div>
            </div>
        `;
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.getTemplate().trim();
        this.element = wrapper.firstChild;
        
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';

        const siteHeader = document.getElementById('site-header');
        if (siteHeader) siteHeader.style.display = 'none';

        this.targetElement.appendChild(this.element);
    }

    cacheDOM() {
        this.closeBtn = this.element.querySelector('.close-button');
        this.scrollUp = this.element.querySelector('#scrollUp');
        this.scrollDown = this.element.querySelector('#scrollDown');

        if (this.data.format === 'webstory') {
            this.mediaPlayer = this.element.querySelector('#mediaPlayer');
            this.playPauseBtn = this.element.querySelector('#playPauseButton');
            this.playPauseIcon = this.element.querySelector('#playPauseIcon');
            this.muteBtn = this.element.querySelector('#muteButton');
            this.muteIcon = this.element.querySelector('#muteIcon');
            
            const allFills = this.element.querySelectorAll('.progress-fill');
            this.currentProgressFill = allFills[this.currentNestedIndex];

            this.leftOverlay = this.element.querySelector('.left-overlay');
            this.rightOverlay = this.element.querySelector('.right-overlay');
            this.centerOverlay = this.element.querySelector('.center-overlay');
        } else {
            this.videoPlayerArea = this.element.querySelector('.video-player');
            this.shareBtnDesktop = this.element.querySelector('#btn-share-social-desktop');
            this.shareMenuDesktop = this.element.querySelector('#share-link-media-desktop');
            this.readMoreBtns = this.element.querySelectorAll('.read-more-section');
            this.copyLinkBtns = this.element.querySelectorAll('.copy-link');

            this.mobileVideoInfo = this.element.querySelector('#mobile-video-info');
            this.sectionContentDesc = this.element.querySelector('#section-content-description');
            this.popupShortsOverlay = this.element.querySelector('.popup-shorts-overlay');
            this.popupShortsContent = this.element.querySelector('.popup-shorts-content');
            this.closeDescBtn = this.element.querySelector('#closedescription');
            
            this.shareBtnMobile = this.element.querySelector('#btn-share-mobile');
            this.popupShareOverlay = this.element.querySelector('.popup-share-overlay');
            this.popupShareContent = this.element.querySelector('.popup-share-content');
            this.closeShareBtn = this.element.querySelector('#closedescriptionShare');
            this.emotes = this.element.querySelectorAll('.emote div');
        }
    }

    bindEvents() {
        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.destroy(true));
        document.addEventListener('keydown', this.handleKeydown);
        
        if (this.scrollUp) this.scrollUp.addEventListener('click', () => this.playPrevGroup());
        if (this.scrollDown) this.scrollDown.addEventListener('click', () => this.playNextGroup());

        if (this.data.format === 'webstory') {
            if (this.leftOverlay) this.leftOverlay.addEventListener('click', () => this.playPrevNested());
            if (this.rightOverlay) this.rightOverlay.addEventListener('click', () => this.playNextNested());

            if (this.centerOverlay) {
                const pauseMedia = () => { this.isPaused = true; if(this.data.type === 'mp4') this.mediaPlayer.pause(); };
                const resumeMedia = () => { this.isPaused = false; if(this.data.type === 'mp4') this.mediaPlayer.play(); };

                this.centerOverlay.addEventListener('touchstart', pauseMedia, {passive: true});
                this.centerOverlay.addEventListener('mousedown', pauseMedia);
                this.centerOverlay.addEventListener('touchend', resumeMedia);
                this.centerOverlay.addEventListener('mouseup', resumeMedia);
            }

            if (this.playPauseBtn) {
                this.playPauseBtn.addEventListener('click', () => {
                    this.isPaused = !this.isPaused;
                    if (this.data.type === 'mp4') this.isPaused ? this.mediaPlayer.pause() : this.mediaPlayer.play();
                    this.playPauseIcon.src = this.isPaused ? '/themes/custom/telkomsel/assets/img/revamp/play.svg' : '/themes/custom/telkomsel/assets/img/revamp/pause.svg';
                });
            }

            if (this.muteBtn && this.data.type === 'mp4') {
                this.muteBtn.addEventListener('click', () => {
                    this.mediaPlayer.muted = !this.mediaPlayer.muted;
                    this.muteIcon.src = this.mediaPlayer.muted ? '/themes/custom/telkomsel/assets/img/revamp/mute.svg' : '/themes/custom/telkomsel/assets/img/revamp/sound.svg';
                });
            } else if (this.muteBtn && this.data.type === 'image') {
                this.muteBtn.style.display = 'none';
            }
        } 
        else {
            if (this.shareBtnDesktop && this.shareMenuDesktop) {
                this.shareBtnDesktop.addEventListener('click', () => {
                    this.shareMenuDesktop.style.display = window.getComputedStyle(this.shareMenuDesktop).display === 'none' ? 'flex' : 'none';
                });
            }

            this.readMoreBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const descContainer = e.target.previousElementSibling;
                    const isExpanded = descContainer.classList.toggle('expanded');
                    e.target.textContent = isExpanded ? 'Sembunyikan' : 'Selengkapnya';
                });
            });

            this.copyLinkBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const urlToCopy = btn.querySelector('div').getAttribute('data-url');
                    navigator.clipboard.writeText(urlToCopy).catch(() => {});
                });
            });

            if (this.emotes) {
                this.emotes.forEach(emote => emote.addEventListener('click', (e) => this.animateEmote(e.currentTarget)));
            }

            const openDescModal = () => {
                this.popupShortsOverlay.classList.add('popup-video-shorts-active');
                this.popupShortsContent.classList.add('popup-shorts-active');
                if (this.closeBtn) this.closeBtn.style.display = 'none';
            };

            const openShareModal = () => {
                this.popupShareOverlay.classList.add('popup-video-share-active');
                this.popupShareContent.classList.add('popup-share-active');
                this.popupShortsOverlay.classList.remove('popup-video-shorts-active');
                this.popupShortsContent.classList.remove('popup-shorts-active');
                if (this.closeBtn) this.closeBtn.style.display = 'none';
            };

            const closeAllModals = () => {
                this.popupShortsOverlay.classList.remove('popup-video-shorts-active');
                this.popupShortsContent.classList.remove('popup-shorts-active');
                this.popupShareOverlay.classList.remove('popup-video-share-active');
                this.popupShareContent.classList.remove('popup-share-active');
                if (this.closeBtn) this.closeBtn.style.display = 'block';
            };

            if (this.mobileVideoInfo) this.mobileVideoInfo.addEventListener('click', openDescModal);
            if (this.sectionContentDesc) this.sectionContentDesc.addEventListener('click', openDescModal);
            if (this.shareBtnMobile) this.shareBtnMobile.addEventListener('click', openShareModal);

            if (this.closeDescBtn) this.closeDescBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAllModals(); });
            if (this.closeShareBtn) this.closeShareBtn.addEventListener('click', (e) => { e.stopPropagation(); closeAllModals(); });

            const overlays = [this.popupShortsContent, this.popupShareContent];
            overlays.forEach(overlay => {
                if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAllModals(); });
            });
        }
    }

    startMediaProgress() {
        this.cancelCurrentAnimation();

        if (this.data.type === 'mp4') {
            this.mediaPlayer.addEventListener('timeupdate', () => {
                if (!this.isPaused && this.currentProgressFill) {
                    const percentage = (this.mediaPlayer.currentTime / this.mediaPlayer.duration) * 100;
                    this.currentProgressFill.style.width = percentage + '%';
                }
            });
            this.mediaPlayer.addEventListener('ended', () => this.playNextNested());
        
        } else if (this.data.type === 'image') {
            this.startTime = Date.now() - this.elapsedTime;
            const animateImageProgress = () => {
                if (!this.isPaused) {
                    const now = Date.now();
                    this.elapsedTime = now - this.startTime;
                    const percentage = (this.elapsedTime / this.imageDuration) * 100;

                    if (percentage >= 100) {
                        if (this.currentProgressFill) this.currentProgressFill.style.width = '100%';
                        this.playNextNested();
                        return;
                    } else {
                        if (this.currentProgressFill) this.currentProgressFill.style.width = percentage + '%';
                    }
                } else {
                    this.startTime = Date.now() - this.elapsedTime;
                }
                this.currentAnimationFrame = requestAnimationFrame(animateImageProgress);
            };
            this.currentAnimationFrame = requestAnimationFrame(animateImageProgress);
        }
    }

    cancelCurrentAnimation() {
        if (this.currentAnimationFrame) {
            cancelAnimationFrame(this.currentAnimationFrame);
            this.currentAnimationFrame = null;
        }
    }

    playNextNested() {
        if (this.currentNestedIndex < this.items.length - 1) {
            const onClose = this.data.onClose;
            this.destroy(false); 
            new VideoStoryPlayer({ triggerGroup: this.triggerGroup, nestedIndex: this.currentNestedIndex + 1, onClose: onClose });
        } else {
            this.playNextGroup();
        }
    }

    playPrevNested() {
        const onClose = this.data.onClose;
        if (this.currentNestedIndex > 0) {
            this.destroy(false);
            new VideoStoryPlayer({ triggerGroup: this.triggerGroup, nestedIndex: this.currentNestedIndex - 1, onClose: onClose });
        } else {
            if (this.currentGroupIndex > 0) {
                this.destroy(false);
                const prevGroup = this.allGroups[this.currentGroupIndex - 1];
                const prevItemsCount = prevGroup.querySelectorAll('[data-story-item]').length;
                new VideoStoryPlayer({ triggerGroup: prevGroup, nestedIndex: prevItemsCount - 1, onClose: onClose });
            }
        }
    }

    playNextGroup() {
        if (this.currentGroupIndex < this.allGroups.length - 1) {
            const onClose = this.data.onClose;
            this.destroy(false);
            new VideoStoryPlayer({ triggerGroup: this.allGroups[this.currentGroupIndex + 1], nestedIndex: 0, onClose: onClose });
        } else {
            this.destroy(true); 
        }
    }

    playPrevGroup() {
        if (this.currentGroupIndex > 0) {
            const onClose = this.data.onClose;
            this.destroy(false);
            new VideoStoryPlayer({ triggerGroup: this.allGroups[this.currentGroupIndex - 1], nestedIndex: 0, onClose: onClose });
        }
    }

    initTouchSwipeWebStory() {
        let startY = 0, isDragging = false;
        this.element.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; isDragging = false; }, { passive: true });
        this.element.addEventListener("touchmove", (e) => {
            if (Math.abs(e.touches[0].clientY - startY) > 50) { isDragging = true; if (e.cancelable) e.preventDefault(); }
        }, { passive: false });
        this.element.addEventListener("touchend", (e) => {
            if (!isDragging) return;
            let deltaY = e.changedTouches[0].clientY - startY;
            if (deltaY < -50) this.playNextGroup(); 
            else if (deltaY > 50) this.playPrevGroup(); 
            isDragging = false;
        });
    }

    initTouchHandlingDefault() {
        let startY = 0, isDragging = false;
        if (!this.videoPlayerArea) return;

        this.element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = false;
            this.videoPlayerArea.style.transition = 'none';
        }, { passive: true });

        this.element.addEventListener('touchmove', (e) => {
            let currentY = e.touches[0].clientY;
            let deltaY = Math.abs(currentY - startY);
            
            if (deltaY > 10) {
                isDragging = true;
                if (e.cancelable) e.preventDefault();
                if ((this.currentGroupIndex === 0 && currentY - startY > 0) || 
                    (this.currentGroupIndex === this.allGroups.length - 1 && currentY - startY < 0)) {
                    return;
                }
            }
        }, { passive: false });

        this.element.addEventListener('touchend', (e) => {
            let deltaY = e.changedTouches[0].clientY - startY;
            this.videoPlayerArea.style.transition = 'transform 0.3s ease-out';
            if (isDragging && Math.abs(deltaY) > 50) {
                if (deltaY < 0 && this.currentGroupIndex < this.allGroups.length - 1) this.playNextGroup();
                else if (deltaY > 0 && this.currentGroupIndex > 0) this.playPrevGroup();
            }
            isDragging = false;
        });
    }

    handleKeydown(e) {
        if (!document.querySelector('.video-player-container')) return;
        if (e.key === "ArrowLeft") this.playPrevNested();
        else if (e.key === "ArrowRight") this.playNextNested();
        else if (e.key === "ArrowUp") this.playPrevGroup();
        else if (e.key === "ArrowDown") this.playNextGroup();
        else if (e.key === "Escape") this.destroy(true);
    }

    addOverlayStyles() {
        if (document.getElementById('video-touch-styles')) return;
        const style = document.createElement('style');
        style.id = 'video-touch-styles';
        style.innerHTML = `
            .progress-bar-container { display:flex; gap:4px; margin-bottom:10px; }
            .progress-bar-segment { flex:1; height:4px; background:rgba(255,255,255,0.3); border-radius:4px; overflow:hidden; }
            .progress-fill { height:100%; background:#fff; transition: width 0.1s linear; }
            .video-player { -webkit-overflow-scrolling: touch; position: relative; }
            .video-player iframe.video-element { position: relative; z-index: 1; pointer-events: auto !important; }
            .touch-overlay { position: absolute; z-index: 10; background: transparent; touch-action: none; user-select: none; }
            .top-overlay { top: 0; left: 0; width: 100%; height: 15%; }
            .left-overlay { top: 15%; left: 0; width: 40%; height: 70%; }
            .right-overlay { top: 15%; right: 0; width: 40%; height: 70%; }
            .center-overlay { top: 15%; left: 30%; width: 40%; height: 70%; cursor: pointer;}
        `;
        document.head.appendChild(style);
    }

    updateButtonState() {
        if (this.currentGroupIndex === 0 && this.currentNestedIndex === 0) this.scrollUp.classList.add('disabled');
        else this.scrollUp.classList.remove('disabled');

        if (this.currentGroupIndex === this.allGroups.length - 1 && this.currentNestedIndex === this.items.length - 1) this.scrollDown.classList.add('disabled');
        else this.scrollDown.classList.remove('disabled');
    }

    updateURLWithVideoId() {
        if (!this.data.id) return;
        const url = new URL(window.location.href);
        url.searchParams.set('video', this.data.id);
        history.pushState({ videoId: this.data.id }, "", url.toString());
    }

    sendStatistic() {
        if (!this.data.nid) return;
        const formData = new URLSearchParams();
        formData.append('nid', this.data.nid);
        fetch('/core/modules/statistics/statistics.php', { method: 'POST', body: formData }).catch(() => {});
    }

    animateEmote(emoteElement) {
        if(!this.videoPlayerArea) return;
        const emoteContent = emoteElement.innerHTML;
        const floatingEmote = document.createElement('div');
        floatingEmote.className = 'floating-emote';
        floatingEmote.innerHTML = emoteContent;
        
        Object.assign(floatingEmote.style, {
            position: "absolute", bottom: "10px", right: "20px", fontSize: "2rem",
            opacity: "0", zIndex: "999999", pointerEvents: "none"
        });

        this.element.appendChild(floatingEmote);
        const flyDistance = this.element.offsetHeight || window.innerHeight;

        const animation = floatingEmote.animate([
            { transform: 'translateY(0) scale(0.5)', opacity: 0 },
            { transform: 'translateY(-50px) scale(1.2)', opacity: 1, offset: 0.1 },
            { transform: `translateY(-${flyDistance / 1.5}px) scale(1)`, opacity: 0 }
        ], { duration: 1800, easing: "cubic-bezier(0.25, 1, 0.5, 1)" });

        animation.onfinish = () => floatingEmote.remove();
    }

    destroy(fullClose = true) {
        this.cancelCurrentAnimation();
        document.removeEventListener('keydown', this.handleKeydown);
        
        if (this.element) this.element.remove();
        
        if (fullClose) {
            const url = new URL(window.location.href);
            url.searchParams.delete('video');
            history.pushState({}, "", url.toString());
            
            const siteHeader = document.getElementById('site-header');
            if (siteHeader) siteHeader.style.display = 'block';

            if (typeof this.data.onClose === 'function') this.data.onClose();
        }
    }

    static initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('video');
        if (videoId) {
            const item = document.querySelector(`[data-story-id="${videoId}"]`);
            if (item) {
                const group = item.closest('[data-story-group]');
                const items = Array.from(group.querySelectorAll('[data-story-item]'));
                const nestedIndex = items.indexOf(item);

                new VideoStoryPlayer({
                    triggerGroup: group,
                    nestedIndex: nestedIndex !== -1 ? nestedIndex : 0,
                    onClose: () => document.body.classList.remove('no-scroll')
                });
                document.body.classList.add('no-scroll');
            }
        }
    }
}