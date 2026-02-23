document.addEventListener("DOMContentLoaded", function () {
            function bindCounter(group, minValue) {
                if (!group) return;
                var minusBtn = group.querySelector(".minus");
                var plusBtn = group.querySelector(".plus");
                var numEl = group.querySelector(".num");
                if (!minusBtn || !plusBtn || !numEl) return;

                function getValue() {
                    var value = parseInt(numEl.textContent, 10);
                    return Number.isNaN(value) ? minValue : value;
                }

                minusBtn.addEventListener("click", function () {
                    var current = getValue();
                    numEl.textContent = String(Math.max(minValue, current - 1));
                });

                plusBtn.addEventListener("click", function () {
                    var current = getValue();
                    numEl.textContent = String(current + 1);
                });
            }

            var page = document.querySelector(".page");
            var addButtons = document.querySelectorAll(".page_bottom .add");
            if (page && addButtons.length) {
                addButtons.forEach(function (addButton) {
                    addButton.addEventListener("click", function () {
                        var panel = addButton.getAttribute("data-panel");
                        var isOpen = addButton.classList.contains("is_open");

                        addButtons.forEach(function (item) {
                            item.classList.remove("is_open");
                            item.setAttribute("aria-expanded", "false");
                        });
                        page.classList.remove("show-topping", "show-side");

                        if (isOpen) return;

                        addButton.classList.add("is_open");
                        addButton.setAttribute("aria-expanded", "true");

                        if (panel === "topping") {
                            page.classList.add("show-topping");
                        } else if (panel === "side") {
                            page.classList.add("show-side");
                        }
                    });
                });
            }

            var size = document.querySelector(".size");
            if (size) {
                var sizeButtons = size.querySelectorAll(".button button");
                sizeButtons.forEach(function (button) {
                    button.addEventListener("click", function () {
                        sizeButtons.forEach(function (item) {
                            item.classList.remove("is_active");
                            item.setAttribute("aria-pressed", "false");
                        });
                        button.classList.add("is_active");
                        button.setAttribute("aria-pressed", "true");
                    });
                });
            }

            bindCounter(document.querySelector(".quantity .button"), 1);
            var sideCounters = document.querySelectorAll(".page_side .side .button");
            sideCounters.forEach(function (counter) {
                bindCounter(counter, 0);
            });

            var foodOpenButton = document.querySelector(".order > .text .bottom");
            var foodInfo = document.querySelector(".food_info");
            var foodOverlay = document.querySelector(".food_overlay");
            var foodCloseButton = document.querySelector(".food_close");
            var ingredientButtons = document.querySelectorAll(".food_info .main_info .ingredient");
            var subTabButtons = document.querySelectorAll(".food_info .sub_txt .txt");

            function closeFoodInfo() {
                document.body.classList.remove("food_info_open");
                if (foodInfo) {
                    foodInfo.setAttribute("aria-hidden", "true");
                }
                if (foodOverlay) {
                    foodOverlay.setAttribute("aria-hidden", "true");
                }
            }

            function openFoodInfo() {
                document.body.classList.add("food_info_open");
                if (foodInfo) {
                    foodInfo.setAttribute("aria-hidden", "false");
                }
                if (foodOverlay) {
                    foodOverlay.setAttribute("aria-hidden", "false");
                }
            }

            if (foodOpenButton) {
                foodOpenButton.addEventListener("click", function () {
                    openFoodInfo();
                });
            }

            if (foodCloseButton) {
                foodCloseButton.addEventListener("click", function () {
                    closeFoodInfo();
                });
            }

            if (foodOverlay) {
                foodOverlay.addEventListener("click", function () {
                    closeFoodInfo();
                });
            }

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    closeFoodInfo();
                }
            });

            ingredientButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    ingredientButtons.forEach(function (item) {
                        item.classList.remove("is_active");
                        item.setAttribute("aria-pressed", "false");
                    });
                    button.classList.add("is_active");
                    button.setAttribute("aria-pressed", "true");
                });
            });

            subTabButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    subTabButtons.forEach(function (item) {
                        item.classList.remove("is_active");
                        item.setAttribute("aria-pressed", "false");
                    });
                    button.classList.add("is_active");
                    button.setAttribute("aria-pressed", "true");
                });
            });

        });
