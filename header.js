$(document).ready(function () {
    $(".menu-icon").on("click", function () {
        var nav = $("nav");
        var iconBefore = $(".menu-icon-before");
        var iconAfter = $(".menu-icon-after");

        if (nav.hasClass("nav-visible")) {
            nav.removeClass("nav-visible");
            iconBefore.css("display", "block");
            iconAfter.css("display", "none");
        } else {
            nav.addClass("nav-visible");
            iconBefore.css("display", "none");
            iconAfter.css("display", "block");
        }
    });

    $(".hamburger-menu").on("mouseleave", function () {
        var nav = $("nav");
        var iconBefore = $(".menu-icon-before");
        var iconAfter = $(".menu-icon-after");

        if (nav.hasClass("nav-visible")) {
            nav.removeClass("nav-visible");
            iconBefore.css("display", "block");
            iconAfter.css("display", "none");
        }
    });
});

window.logout = async function () {
    try {
        await firebase.auth().signOut();
        window.location.href = "login.html";
    } catch (error) {
        console.error(error);
        alert('ログアウトに失敗しました。');
    }
}


firebase.auth().onAuthStateChanged(user => {
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('User is logged out.');
    }
});

async function checkLoginStatus() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "login.html";
            } else {
                resolve(true);
            }
        });
    });
}
