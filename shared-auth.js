// Shared authentication and Firebase functionality

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkKclvdWHVQ58IFG_ap0ByJA_2a8J2YXU",
    authDomain: "owngoal-4f34f.firebaseapp.com",
    projectId: "owngoal-4f34f",
    storageBucket: "owngoal-4f34f.firebasestorage.app",
    messagingSenderId: "270078133518",
    appId: "1:270078133518:web:36ef7431fda632bed1c35f"
};

// Authentication variables (to be set by each page)
let mainContainer, loginSplashScreen, loginError, loginButton, passwordInput;

// Initialize auth elements (call this from each page)
function initializeAuthElements() {
    mainContainer = document.getElementById('mainContainer');
    loginSplashScreen = document.getElementById('loginSplashScreen');
    loginError = document.getElementById('loginError');
    loginButton = document.getElementById('loginButton');
    passwordInput = document.getElementById('passwordInput');
    
    // Add enter key handler for password input
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                signIn();
            }
        });
    }
}

// Sign in function
function signIn() {
    const email = 'standard@yourapp.local';
    const password = passwordInput.value;
    
    if (!password) {
        loginError.textContent = "Please enter your password.";
        return;
    }

    loginButton.disabled = true;
    loginError.textContent = '';

    console.log('Attempting to sign in user:', email);

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Sign in successful for:', userCredential.user.email);
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            loginError.textContent = getUserFriendlyAuthError(error);
            loginButton.disabled = false;
        });
}

// Sign out function
function signOut() {
    firebase.auth().signOut().then(() => {
        console.log('User signed out');
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
}

// User-friendly error messages
function getUserFriendlyAuthError(error) {
    switch (error.code) {
        case 'auth/invalid-login-credentials':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-email':
            return "Incorrect password. Please try again.";
        case 'auth/too-many-requests':
            return "Access temporarily disabled. Please try again later.";
        case 'auth/network-request-failed':
            return "Network error. Please check your connection.";
        default:
            return "Login error: " + error.message;
    }
}

// Fetch duty tracker from Firebase Storage
function fetchDutyTracker() {
    return new Promise((resolve, reject) => {
        const storageRef = firebase.storage().ref('tracker');
        
        storageRef.listAll()
            .then((result) => {
                console.log('Files found in tracker folder:', result.items.length);
                
                if (result.items.length === 0) {
                    throw new Error('No files found in tracker folder');
                }
                
                const trackerFile = result.items.find(item => item.name === 'duty-tracker.txt');
                if (!trackerFile) {
                    throw new Error('duty-tracker.txt not found in tracker folder');
                }
                
                console.log('Found duty-tracker.txt, getting download URL...');
                return trackerFile.getDownloadURL();
            })
            .then((url) => {
                console.log('Download URL obtained:', url);
                return fetch(url);
            })
            .then(response => {
                console.log('Fetch response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return response.text();
            })
            .then(text => {
                console.log('Duty tracker loaded successfully. Length:', text.length);
                // Set dutyData on the global scope (each page manages this differently)
                if (typeof window.dutyData !== 'undefined') {
                    window.dutyData = text;
                } else if (typeof dutyData !== 'undefined') {
                    dutyData = text;
                }
                resolve();
            })
            .catch(error => {
                console.error('Error fetching duty tracker:', error);
                reject(error);
            });
    });
}

// Firebase SDK loader and initialization
function loadFirebase(onAuthStateChanged) {
    const loadScript = (src, callback) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.body.appendChild(script);
    };
    
    loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', () => {
        loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js', () => {
            loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js', () => {
                // Initialize Firebase
                firebase.initializeApp(firebaseConfig);
                
                // Set persistence
                firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                    .catch(error => {
                        console.error("Persistence error:", error);
                    });
                
                // Authentication state handler
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        console.log('User is signed in:', user.email);
                        // Call the page-specific initialization function
                        if (onAuthStateChanged && typeof onAuthStateChanged.onSignedIn === 'function') {
                            onAuthStateChanged.onSignedIn();
                        }
                    } else {
                        console.log('User is signed out.');
                        // Hide loading overlay and show login
                        const loadingOverlay = document.getElementById('loadingOverlay');
                        if (loadingOverlay) loadingOverlay.style.display = 'none';
                        
                        if (loginSplashScreen) {
                            loginSplashScreen.style.display = 'flex';
                            loginSplashScreen.style.opacity = '1';
                        }
                        if (mainContainer) {
                            mainContainer.style.display = 'none';
                        }
                        if (loginButton) {
                            loginButton.disabled = false;
                        }
                        
                        // Call the page-specific sign out handler
                        if (onAuthStateChanged && typeof onAuthStateChanged.onSignedOut === 'function') {
                            onAuthStateChanged.onSignedOut();
                        }
                    }
                });
            });
        });
    });
}