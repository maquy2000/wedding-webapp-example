// Chạy: node tests/setting-model.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const M = require("../assets/js/setting-model.js");

const root = path.join(__dirname, "..");

function loadScript(file, name) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return context.window[name];
}

const model = M.normalizeModel(loadScript("assets/js/config-setting.js", "WEDDING_SETTING"));

// 2 file thiệp trên đĩa phải đúng là bản được tạo từ config-setting.js (và lưu lại setting không đổi gì).
const files = M.configFiles(model);
assert.deepStrictEqual(Object.keys(files).sort(), [
  "assets/js/config-bride.js",
  "assets/js/config-groom.js",
  "assets/js/config-setting.js"
]);
for (const [file, content] of Object.entries(files)) {
  const current = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
  assert.strictEqual(content, current, `${file} chưa đồng bộ với config-setting.js`);
}

// Thiệp nhà nào thì tên + thông tin nhà đó đứng trước.
const g = M.buildConfig(model, "groom");
const b = M.buildConfig(model, "bride");
assert.strictEqual(g.side, "groom");
assert.deepStrictEqual(g.events.map(e => e.key), ["groom", "bride"]);
assert.deepStrictEqual(b.events.map(e => e.key), ["bride", "groom"]);
assert.ok(g.siteTitle.endsWith(`${model.couple.groomName} & ${model.couple.brideName}`));
assert.ok(b.siteTitle.endsWith(`${model.couple.brideName} & ${model.couple.groomName}`));
assert.strictEqual(g.text.invitationTitle, model.families.groom.invitationTitle);
assert.strictEqual(b.dates.weddingDate, model.families.bride.dates.weddingDate);

// Sửa ở Setting một lần, cả hai thiệp đổi theo.
model.text.albumTitle = "Album mới";
model.families.bride.address = "Địa chỉ mới";
for (const side of M.SIDES) {
  const config = M.buildConfig(model, side);
  assert.strictEqual(config.text.albumTitle, "Album mới");
  assert.strictEqual(config.events.find(e => e.key === "bride").address, "Địa chỉ mới");
}

// Đường dẫn trong config phải tính từ thư mục gốc, không có "../".
assert.ok(!Object.values(files).join("").includes("../"), "config còn đường dẫn ../");

// Setting rỗng/thiếu trường vẫn đủ trường.
const empty = M.normalizeModel(undefined);
assert.strictEqual(empty.ui.sections.home, true);
assert.strictEqual(empty.families.bride.label, "Nhà gái");
assert.deepStrictEqual(empty.album, []);

console.log("OK - setting-model");
