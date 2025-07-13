function onSignIn(response) {
    const idToken = response.credential;
    console.log("ID token:", idToken);
    // do stuff
}

// This function is never called at the moment
function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
}
