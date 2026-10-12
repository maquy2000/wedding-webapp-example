// Tạo 2 file config-groom.js / config-bride.js từ dữ liệu gốc config-setting.js của trang Setting.
// Không đụng tới DOM để có thể test bằng node (tests/setting-model.test.js).
(function (root) {
  const SIDES = ["groom", "bride"];

  function defaultFamily(key) {
    return {
      label: key === "groom" ? "Nhà trai" : "Nhà gái",
      invitationTitle: "",
      dates: { weddingDate: "", coverDate: "", displayDate: "" },
      reception: { title: "", time: "" },
      ceremony: { title: "", time: "" },
      address: "",
      mapUrl: "",
      image: "",
      imageAlt: ""
    };
  }

  function defaultModel() {
    return {
      couple: { groomName: "", brideName: "" },
      music: { enabled: true, src: "" },
      text: {
        coverEyebrow: "",
        openButton: "",
        heroEyebrow: "",
        heroDescription: "",
        invitationEyebrow: "",
        invitationDescription: "",
        eventEyebrow: "",
        eventTitle: "",
        albumEyebrow: "",
        albumTitle: "",
        giftEyebrow: "",
        giftTitle: "",
        giftDescription: "",
        bankTitle: "",
        thanksTitle: "",
        thanksMessage: ""
      },
      images: { cover: "", couple: "", gift: "" },
      ui: {
        autoScroll: true,
        albumLimit: 0,
        sections: {
          home: true,
          story: true,
          invitation: true,
          event: true,
          album: true,
          gift: true,
          rsvp: false,
          thanks: true
        },
        blocks: { countdown: true, bankInfo: true }
      },
      album: [],
      bank: { bankName: "", accountOwner: "", accountNumber: "" },
      families: { groom: defaultFamily("groom"), bride: defaultFamily("bride") }
    };
  }

  // Chỉ lấy các key có trong khuôn mẫu, để model luôn đủ trường và không mang theo trường lạ.
  function fill(template, value) {
    if (Array.isArray(template)) return Array.isArray(value) ? value : template;
    if (template && typeof template === "object") {
      const result = {};
      const source = value && typeof value === "object" ? value : {};
      Object.keys(template).forEach(key => {
        result[key] = fill(template[key], source[key]);
      });
      return result;
    }
    if (value === undefined || value === null) return template;
    if (typeof template === "number") return Number(value) || 0;
    if (typeof template === "boolean") return Boolean(value);
    return String(value);
  }

  // Dữ liệu đọc từ config-setting.js, bổ sung trường còn thiếu bằng giá trị mặc định.
  function normalizeModel(data) {
    const model = fill(defaultModel(), data);
    model.album = model.album.map(item => ({ src: (item && item.src) || "", alt: (item && item.alt) || "" }));
    return model;
  }

  function eventFromFamily(key, family) {
    return {
      key,
      label: family.label,
      ceremony: { ...family.ceremony },
      reception: { ...family.reception },
      address: family.address,
      mapUrl: family.mapUrl,
      image: family.image,
      imageAlt: family.imageAlt
    };
  }

  // Thiệp nhà nào thì tên và thông tin nhà đó đứng trước.
  function buildConfig(model, side) {
    const other = side === "groom" ? "bride" : "groom";
    const own = model.families[side];
    const names = side === "groom"
      ? [model.couple.groomName, model.couple.brideName]
      : [model.couple.brideName, model.couple.groomName];
    const coupleText = names.join(" & ");

    return {
      side,
      siteTitle: `Thiệp Cưới - ${coupleText}`,
      description: `Thiệp cưới online của ${coupleText}.`,
      couple: { ...model.couple },
      dates: { ...own.dates },
      music: { ...model.music },
      text: { ...model.text, invitationTitle: own.invitationTitle },
      images: { ...model.images },
      ui: {
        ...model.ui,
        sections: { ...model.ui.sections },
        blocks: { ...model.ui.blocks }
      },
      events: [eventFromFamily(side, own), eventFromFamily(other, model.families[other])],
      album: model.album.map(item => ({ src: item.src, alt: item.alt })),
      bank: { ...model.bank }
    };
  }

  function serializeConfig(config) {
    return "// File này được tạo bởi Setting/index.html. Nên sửa bằng trang Setting thay vì sửa tay.\n"
      + "// Mọi đường dẫn ảnh/nhạc tính từ thư mục gốc của project, ví dụ: assets/images/abc.jpg\n"
      + "window.WEDDING_CONFIG = " + JSON.stringify(config, null, 2) + ";\n";
  }

  function serializeSetting(model) {
    return "// Dữ liệu gốc của trang Setting. Khi bấm Lưu, config-groom.js và config-bride.js được tạo lại từ file này.\n"
      + "window.WEDDING_SETTING = " + JSON.stringify(model, null, 2) + ";\n";
  }

  // 3 file được ghi mỗi lần lưu: dữ liệu gốc + 2 thiệp.
  function configFiles(model) {
    const files = { "assets/js/config-setting.js": serializeSetting(model) };
    SIDES.forEach(side => {
      files[`assets/js/config-${side}.js`] = serializeConfig(buildConfig(model, side));
    });
    return files;
  }

  const api = { SIDES, defaultModel, normalizeModel, buildConfig, serializeConfig, serializeSetting, configFiles };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SettingModel = api;
})(typeof window !== "undefined" ? window : globalThis);
