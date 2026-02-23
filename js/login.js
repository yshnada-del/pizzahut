document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll("main .login .box_all .box");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((item) => {
                item.classList.remove("active");
                item.classList.add("inactive");
            });

            tab.classList.remove("inactive");
            tab.classList.add("active");
        });
    });
});
