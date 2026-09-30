const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector("#site-menu");
const themeToggle = document.querySelector(".theme-toggle");
const projectList = document.querySelector("#project-list");
const pageHeader = document.querySelector("header");
const scrollTopButton = document.querySelector("#scroll-top");
const sections = document.querySelectorAll("main > section");
const contactForm = document.querySelector("#contact-form");
const formFields = contactForm.querySelectorAll("input, textarea");
const formStatus = document.querySelector("#form-status");

function setMenuOpen(isOpen) {
    siteMenu.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
}

menuToggle.addEventListener("click", () => {
    setMenuOpen(!siteMenu.classList.contains("is-open"));
});

siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteMenu.classList.contains("is-open")) {
        setMenuOpen(false);
        menuToggle.focus();
    }
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
    );
}

const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
});

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

async function loadProjects() {
    projectList.innerHTML = '<p role="status">로딩 중...</p>';

    try {
        const response = await fetch(
            "https://api.github.com/users/cdlwhdans/repos?sort=updated&per_page=100"
        );

        if (!response.ok) {
            throw new Error(`GitHub API 오류: ${response.status}`);
        }

        const repos = await response.json();

        if (!Array.isArray(repos)) {
            throw new Error("저장소 목록 형식이 올바르지 않습니다.");
        }

        if (repos.length === 0) {
            projectList.innerHTML =
                '<p role="status">표시할 프로젝트가 없습니다.</p>';
            return;
        }

        projectList.innerHTML = repos.map(({ name, description }) => {
            const repoUrl = `https://github.com/cdlwhdans/${encodeURIComponent(name)}`;

            return `
                <article>
                    <h3>${escapeHtml(name)}</h3>
                    <p>${escapeHtml(description || "설명이 없습니다.")}</p>
                    <a class="text-link" href="${repoUrl}" target="_blank" rel="noopener noreferrer">
                        GitHub에서 보기 <span class="icon icon-arrow-diagonal" aria-hidden="true"></span>
                    </a>
                </article>
            `;
        }).join("");
    } catch (error) {
        console.error(error);

        projectList.innerHTML = `
            <div class="project-state">
                <p role="alert">프로젝트를 불러올 수 없습니다.</p>
                <button class="retry-button button button-primary" type="button">다시 시도</button>
            </div>
        `;

        projectList
            .querySelector(".retry-button")
            .addEventListener("click", loadProjects);
    }
}

loadProjects();

function updateScrollUI() {
    pageHeader.classList.toggle("is-scrolled", window.scrollY >= 60);
    scrollTopButton.classList.toggle("is-visible", window.scrollY >= 300);

    const screenCenter = window.innerHeight / 2;

    sections.forEach((section) => {
        const { top, bottom } = section.getBoundingClientRect();
        const isActive = top <= screenCenter && bottom > screenCenter;

        section.classList.toggle("is-active", isActive);
    });
}

window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI);
updateScrollUI();

scrollTopButton.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
    });
});


let hasSubmitted = false;

function validateField(field) {
    const errorElement = document.querySelector(`#${field.id}-error`);
    let errorMessage = "";

    if (field.value.trim() === "") {
        errorMessage = "필수 입력 항목입니다.";
    } else if (field.type === "email" && field.validity.typeMismatch) {
        errorMessage = "올바른 이메일 주소를 입력해주세요.";
    }

    errorElement.textContent = errorMessage;
    field.setAttribute("aria-invalid", String(errorMessage !== ""));

    return errorMessage === "";
}

formFields.forEach((field) => {
    field.addEventListener("input", () => {
        formStatus.textContent = "";

        if (hasSubmitted) {
            validateField(field);
        }
    });
});

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    hasSubmitted = true;
    formStatus.textContent = "";

    let firstInvalidField = null;

    formFields.forEach((field) => {
        const isValid = validateField(field);

        if (!isValid && firstInvalidField === null) {
            firstInvalidField = field;
        }
    });

    if (firstInvalidField !== null) {
        firstInvalidField.focus();
        return;
    }

    formStatus.textContent = "입력 내용이 정상적으로 확인되었습니다.";
});

contactForm.noValidate = true;
