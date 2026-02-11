
const userRaw = localStorage.getItem("user");
if (!userRaw) window.location.href = "login.html";
const me = JSON.parse(userRaw);

$("#whoami").text(`${me.firstname} ${me.lastname} (@${me.username})`);


const socket = io();


socket.emit("user:set", me.username);

let currentRoom = null;
let typingTimer = null;

function escapeHtml(s) {

    return $("<div>").text(s).html();
}

function appendLine(boxSelector, html) {
    const box = $(boxSelector);
    box.append(`<div class="msg-line">${html}</div>`);
    box.scrollTop(box.prop("scrollHeight"));
}

function formatRoomMsg(doc) {
    return `<div>
        <span class="msg-meta">${escapeHtml(doc.date_sent)}</span>
        <b>${escapeHtml(doc.from_user)}</b>: ${escapeHtml(doc.message)}
    </div>`;
}

function formatPmMsg(doc) {
    return `<div>
        <span class="msg-meta">${escapeHtml(doc.date_sent)}</span>
        <b>${escapeHtml(doc.from_user)}</b> → <b>${escapeHtml(doc.to_user)}</b>:
        ${escapeHtml(doc.message)}
    </div>`;
}

(async function loadUsers() {
    try {
        const res = await fetch("/api/auth/users");
        const data = await res.json();

        const users = data.users || []; 

        const sel = $("#pmUser");
        sel.empty();

        users
            .filter(u => u.username !== me.username)
            .forEach(u => {
                sel.append(`<option value="${escapeHtml(u.username)}">${escapeHtml(u.username)}</option>`);
            });

        if (sel.children().length === 0) {
            sel.append(`<option value="">No other users yet</option>`);
            sel.prop("disabled", true);
            $("#pmInput").prop("disabled", true);
            $("#pmSend").prop("disabled", true);
        } else {
            sel.prop("disabled", false);
            $("#pmInput").prop("disabled", false);
            $("#pmSend").prop("disabled", false);
        }
    } catch (e) {
    console.error("loadUsers error:", e);
    }
})();


socket.on("rooms:list", (rooms) => {
    const list = $("#roomList");
    list.empty();

    rooms.forEach((r) => {
        list.append(`
        <button class="list-group-item list-group-item-action roomBtn" data-room="${escapeHtml(r)}">
            ${escapeHtml(r)}
        </button>
        `);
    });
});


$(document).on("click", ".roomBtn", function () {
    const room = $(this).data("room");
    currentRoom = room;
    $("#currentRoom").text(room);
    $("#roomStatus").text(`Joined ${room}`);
    $("#roomBox").empty();

    socket.emit("room:join", room);
});


$("#leaveRoomBtn").on("click", () => {
    socket.emit("room:leave");
});


socket.on("room:history", (msgs) => {
    $("#roomBox").empty();
    msgs.forEach((m) => appendLine("#roomBox", formatRoomMsg(m)));
});

socket.on("room:message", (doc) => {
    appendLine("#roomBox", formatRoomMsg(doc));
});


socket.on("room:left", () => {
    currentRoom = null;
    $("#currentRoom").text("none");
    $("#roomStatus").text("You left the room.");
    $("#roomBox").empty();
});


function sendRoom() {
    const text = $("#roomInput").val();
    if (!currentRoom) return $("#roomStatus").text("Join a room first.");
    socket.emit("room:message", text);
    $("#roomInput").val("");
}

$("#roomSend").on("click", sendRoom);
$("#roomInput").on("keypress", (e) => {
    if (e.which === 13) sendRoom();
});


function sendPM() {
    const to_user = $("#pmUser").val();
    const message = $("#pmInput").val();
    if (!to_user) return;

    socket.emit("pm:message", { to_user, message });
    $("#pmInput").val("");
}

$("#pmSend").on("click", sendPM);
$("#pmInput").on("keypress", (e) => {
    if (e.which === 13) sendPM();
});

socket.on("pm:message", (doc) => {
    appendLine("#pmBox", formatPmMsg(doc));
});


$("#pmInput").on("input", () => {
    const to_user = $("#pmUser").val();
    if (!to_user) return;

    socket.emit("pm:typing", { to_user, typing: true });

    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit("pm:typing", { to_user, typing: false });
    }, 600);
});

socket.on("pm:typing", ({ from_user, typing }) => {
    $("#pmTyping").text(typing ? `${from_user} is typing...` : "");
});


$("#logoutBtn").on("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
});
