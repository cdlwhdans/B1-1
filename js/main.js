// DOM 선택: querySelector는 첫 요소, querySelectorAll은 해당 요소 목록 선택.
// .은 class, #은 id, main > section은 직계 자식 section. var 대신 const/let 사용.
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

// 상태 관리: 메뉴/테마/API/폼/스크롤의 현재 값을 중앙 STATE에 모음.
// 사용 이유: 현재 상태와 DOM 변경을 분리해 상태→화면 흐름을 확인하기 쉽게 함.
// STATE 변경만으로 DOM이 바뀌지 않으므로 해당 render 함수를 명시적으로 호출.
// const는 STATE 재대입을 막지만 내부 속성 변경은 가능.
const STATE = {
    menuOpen: false,
    theme: "light",
    projects: {
        status: "loading",
        items: [],
        error: ""
    },
    form: {
        hasSubmitted: false,
        errors: { name: "", email: "", message: "" },
        successMessage: ""
    },
    scroll: {
        headerScrolled: false,
        showTopButton: false,
        activeSectionId: null
    }
};

// 상태→화면: menuOpen에 맞춰 클래스를 추가/제거하고 ARIA 열림 상태도 갱신.
function renderMenu() {
    siteMenu.classList.toggle("is-open", STATE.menuOpen);

    menuToggle.setAttribute("aria-expanded", String(STATE.menuOpen));
    menuToggle.setAttribute("aria-label", STATE.menuOpen ? "메뉴 닫기" : "메뉴 열기");
}

// 상태→화면: theme을 html의 data-theme에 반영. CSS 변수 전환으로 전체 화면 변경.
function renderTheme() {
    document.documentElement.dataset.theme = STATE.theme;

    themeToggle.setAttribute(
        "aria-label",
        STATE.theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
    );
}

// DOM 조작: textContent는 텍스트로, innerHTML은 HTML로 처리.
// 외부 API 문자열을 이스케이프해 카드 안에서 HTML 태그로 해석되는 것을 방지.
function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

// API 상태→렌더링: loading / error / empty / success에 따라 UI 분기.
// 로딩 안내, 오류+재시도, 빈 목록 안내, 성공 시 카드 목록 표시.
function renderProjects() {
    if (STATE.projects.status === "loading") {
        projectList.innerHTML = '<p role="status">로딩 중...</p>';
        return;
    }

    if (STATE.projects.status === "error") {
        projectList.innerHTML = `
            <div class="project-state">
                <p role="alert">프로젝트를 불러올 수 없습니다.</p>
                <button class="retry-button button button-primary" type="button">다시 시도</button>
            </div>
        `;

// 재시도 버튼은 innerHTML로 만든 뒤 이벤트 연결. 함수 참조를 전달해 클릭 시 다시 요청.
        projectList.querySelector(".retry-button").addEventListener("click", loadProjects);
        return;
    }

    if (STATE.projects.status === "empty") {
        projectList.innerHTML = '<p role="status">표시할 프로젝트가 없습니다.</p>';
        return;
    }

// ES6+: map으로 저장소마다 카드 HTML 문자열을 만들어 새 배열 반환.
// ({ name, description })은 구조분해로 필요한 속성 추출. =>는 화살표 함수.
// 템플릿 리터럴에서 ${값} 삽입. join("")으로 배열을 하나의 문자열로 결합.
    projectList.innerHTML = STATE.projects.items.map(({ name, description }) => {
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
}

// 폼 상태→화면: errors를 필드 근처 메시지와 aria-invalid에 반영.
// forEach는 각 요소에 작업 실행. map과 달리 변환 결과 배열을 반환하지 않음.
function renderForm() {
    formFields.forEach((field) => {
        const errorMessage = STATE.form.errors[field.id];
        const errorElement = document.querySelector(`#${field.id}-error`);

        errorElement.textContent = errorMessage;
        field.setAttribute("aria-invalid", String(errorMessage !== ""));
    });

    formStatus.textContent = STATE.form.successMessage;
}

// 스크롤 상태→화면: classList.toggle로 헤더/맨 위로 버튼/애니메이션 제어.
function renderScroll() {
    pageHeader.classList.toggle("is-scrolled", STATE.scroll.headerScrolled);
    scrollTopButton.classList.toggle("is-visible", STATE.scroll.showTopButton);

    sections.forEach((section) => {
        section.classList.toggle("is-active", section.id === STATE.scroll.activeSectionId);
    });
}

// click → menuOpen 반전 → renderMenu.
// HTML 인라인 onclick 대신 외부 JS의 addEventListener로 구조와 동작 분리.
// addEventListener는 같은 이벤트에 여러 리스너 추가 가능. onclick 속성에는 한 핸들러 할당.
menuToggle.addEventListener("click", () => {
    STATE.menuOpen = !STATE.menuOpen;
    renderMenu();
});

// 메뉴 선택 시 열림 상태를 false로 바꾸고 렌더. 링크의 기본 앵커 이동은 유지.
siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        STATE.menuOpen = false;
        renderMenu();
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && STATE.menuOpen) {
        STATE.menuOpen = false;
        renderMenu();
        menuToggle.focus();
    }
});

// click → theme 변경 → renderTheme → localStorage 저장. 초기 실행에서 저장값을 읽어 새로고침 후 유지.
themeToggle.addEventListener("click", () => {
    STATE.theme = STATE.theme === "dark" ? "light" : "dark";
    renderTheme();
    localStorage.setItem("theme", STATE.theme);
});

// 비동기 API: fetch는 Promise 반환. Promise는 나중에 완료될 작업 결과를 나타냄.
// async 함수는 Promise 반환. await는 함수 안의 다음 처리를 기다리며 브라우저 전체를 멈추지 않음.
// Promise 상태: pending/fulfilled/rejected. HTTP 오류도 fetch 자체는 fulfilled가 될 수 있음.
// try/catch 사용 이유: 통신/HTTP/JSON 처리 실패를 error 상태와 재시도 UI로 처리.
async function loadProjects() {
// 요청 시작 시 loading을 먼저 렌더해 기다리는 중임을 안내.
    STATE.projects.status = "loading";
    STATE.projects.error = "";
    renderProjects();

    try {
        const response = await fetch(
            "https://api.github.com/users/cdlwhdans/repos?sort=updated&per_page=100"
        );

// HTTP 403 등은 fetch가 자동으로 예외를 던지지 않으므로 ok 검사. throw로 catch에 오류 전달.
        if (!response.ok) {
            throw new Error(`GitHub API 오류: ${response.status}`);
        }

// JSON 읽기/변환도 Promise이므로 await. 받은 값이 배열인지 확인한 뒤 상태에 저장.
        const repos = await response.json();
        if (!Array.isArray(repos)) {
            throw new Error("저장소 목록 형식이 올바르지 않습니다.");
        }

// 배열이 0개면 empty, 아니면 success. 빈 목록은 통신 실패와 별도 상태.
        STATE.projects.items = repos;
        STATE.projects.status = repos.length === 0 ? "empty" : "success";
// 예외를 잡아 error 상태로 변경. 이후 renderProjects가 오류 메시지와 재시도 버튼 표시.
    } catch (error) {
        STATE.projects.items = [];
        STATE.projects.status = "error";
        STATE.projects.error = String(error);
        console.error(error);
    }

    renderProjects();
}

// scroll → 거리/위치 계산 → STATE.scroll 변경 → renderScroll.
// 기준: 헤더 60px, 맨 위로 버튼 300px, 애니메이션 화면 중앙. README에 명시.
function updateScrollUI() {
    STATE.scroll.headerScrolled = window.scrollY >= 60;
    STATE.scroll.showTopButton = window.scrollY >= 300;
    STATE.scroll.activeSectionId = null;

    const screenCenter = window.innerHeight / 2;

    sections.forEach((section) => {
// 구조분해로 화면 기준 top/bottom 추출. 화면 중앙을 포함하는 섹션 판정.
        const { top, bottom } = section.getBoundingClientRect();
        if (top <= screenCenter && bottom > screenCenter) {
            STATE.scroll.activeSectionId = section.id;
        }
    });

    renderScroll();
}

// scroll/resize 이벤트 연결. passive는 preventDefault로 스크롤을 취소하지 않는다는 선언.
window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI);

// 맨 위로 버튼 클릭 시 최상단 이동. 동작 줄이기 설정이면 즉시 이동.
scrollTopButton.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

// 입력 검사: trim으로 공백만 있는 값도 필수값 오류.
// type=email의 validity.typeMismatch로 이메일 형식 검사. 오류 문구 또는 빈 문자열 반환.
function getFieldError(field) {
    if (field.value.trim() === "") {
        return "필수 입력 항목입니다.";
    }

    if (field.type === "email" && field.validity.typeMismatch) {
        return "올바른 이메일 주소를 입력해주세요.";
    }
    return "";
}

// input → 오류 상태 갱신 → renderForm. 최초 제출 이후에는 입력마다 재검증.
formFields.forEach((field) => {
    field.addEventListener("input", () => {
        STATE.form.successMessage = "";
        if (STATE.form.hasSubmitted) {
            STATE.form.errors[field.id] = getFieldError(field);
        }
        renderForm();
    });
});

// submit → preventDefault로 기본 전송/이동 방지 → 모든 필드 검사 → 오류/성공 상태 렌더.
// 첫 오류 필드에 포커스. 실제 이메일 발송은 선택 과제이므로 미구현.
contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    STATE.form.hasSubmitted = true;
    STATE.form.successMessage = "";
    let firstInvalidField = null;

    formFields.forEach((field) => {
        const errorMessage = getFieldError(field);
        STATE.form.errors[field.id] = errorMessage;
        if (errorMessage !== "" && firstInvalidField === null) {
            firstInvalidField = field;
        }
    });

    if (firstInvalidField !== null) {
        renderForm();
        firstInvalidField.focus();
        return;
    }

    STATE.form.successMessage = "입력 내용이 정상적으로 확인되었습니다.";
    renderForm();
});

// 초기 실행: 저장된 테마를 STATE에 복원 → render → API 요청.
// noValidate로 기본 검증 팝업 대신 입력 필드 근처의 커스텀 오류 안내 사용.
const savedTheme = localStorage.getItem("theme");
STATE.theme = savedTheme === "dark" ? "dark" : "light";
contactForm.noValidate = true;
renderMenu();
renderTheme();
renderForm();
updateScrollUI();
loadProjects();
