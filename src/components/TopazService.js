
export function checkExtensionInstalled() {

    const installed = document.documentElement.getAttribute(
        "SigPlusExtLiteExtension-installed"
    );

    return !!installed;
}

export function getVersionInfo(callback) {

    const versionInfo = {
        metadata: {
            version: 1.0,
            command: "GetVersionInfo"
        }
    };

    const versionInfoData = JSON.stringify(versionInfo);

    const element = document.createElement("MyExtensionDataElementVersionInfo");

    element.setAttribute("msgAttributeVersionInfo", versionInfoData);
    element.setAttribute("msg-Attribute-VersionInfo", versionInfoData);

    document.documentElement.appendChild(element);

    const evt = document.createEvent("Events");
    evt.initEvent("GetVersionInfoEvent", true, false);

    element.dispatchEvent(evt);

    const handler = (event) => {

        let str = event.target.getAttribute("msgAttribute");

        if (!str) {
            str = event.target.getAttribute("msg-Attribute");
        }

        if (!str) return;

        callback(JSON.parse(str));

        top.document.removeEventListener(
            "GetVersionInfoResponse",
            handler
        );
    };

    top.document.addEventListener(
        "GetVersionInfoResponse",
        handler,
        false
    );
}

export function getDeviceStatus(callback) {

    const deviceStatus = {
        metadata: {
            version: 1.0,
            command: "GetDeviceStatus"
        },
        deviceStatus: ""
    };

    const deviceStatusData = JSON.stringify(deviceStatus);

    const element = document.createElement("MyExtensionDataElementDeviceStatus");

    element.setAttribute("msgeAttributeDeviceStatus", deviceStatusData);

    document.documentElement.appendChild(element);

    const evt = document.createEvent("Events");
    evt.initEvent("GetDeviceStatusEvent", true, false);

    element.dispatchEvent(evt);

    const handler = (event) => {

        const str = event.target.getAttribute("msgAttribute");

        if (!str) return;

        callback(JSON.parse(str));

        top.document.removeEventListener(
            "GetDeviceStatusResponse",
            handler
        );
    };

    top.document.addEventListener(
        "GetDeviceStatusResponse",
        handler,
        false
    );
}

export function startSignature(callback) {

    const imgWidth = 800;
    const imgHeight = 200;

    const penThickness = 3;
    const penColor = "#000000";

    const encryptionMode = 0;
    const encryptionKey = "EncryptionKey";

    const sigCompressionMode = 1;

    const message = {
        metadata: {
            version: 1.0,
            command: "SignatureCapture"
        },
        firstName: "",
        lastName: "",
        eMail: "",
        location: "",
        imageFormat: 1,
        imageX: imgWidth,
        imageY: imgHeight,
        imageTransparency: false,
        imageScaling: false,
        maxUpScalePercent: 0.0,
        rawDataFormat: "ENC",
        minSigPoints: 1,
        penThickness: penThickness,
        penColor: penColor,
        encryptionMode: encryptionMode,
        encryptionKey: encryptionKey,
        sigCompressionMode: sigCompressionMode,
        customWindow: true
    };

    const messageData = JSON.stringify(message);

    const element = document.createElement("MyExtensionDataElement");

    element.setAttribute("messageAttribute", messageData);

    document.documentElement.appendChild(element);

    const evt = document.createEvent("Events");

    evt.initEvent("SignStartEvent", true, false);

    element.dispatchEvent(evt);

    const handler = (event) => {

        const str = event.target.getAttribute("msgAttribute");

        if (!str) return;

        const obj = JSON.parse(str);

        if (callback) {
            callback(obj);
        }

        top.document.removeEventListener(
            "SignResponse",
            handler
        );

    };

    top.document.addEventListener(
        "SignResponse",
        handler,
        false
    );

}
