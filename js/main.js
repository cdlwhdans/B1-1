const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector("#site-menu");
const themeToggle = document.querySelector(".theme-toggle");
const projectList = document.querySelector("#project-list");

menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
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
                    <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">
                        GitHub에서 보기
                    </a>
                </article>
            `;
        }).join("");
    } catch (error) {
        console.error(error);

        projectList.innerHTML = `
            <div>
                <p role="alert">프로젝트를 불러올 수 없습니다.</p>
                <button class="retry-button" type="button">다시 시도</button>
            </div>
        `;

        projectList
            .querySelector(".retry-button")
            .addEventListener("click", loadProjects);
    }
}

loadProjects();