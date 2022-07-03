import * as constant from './constant.js'
import * as elements from './elements.js'
import * as store from './store.js'

export const updatePersonalCode = (personalCode) => {
    const personalCodeParagraph = document.getElementById('personal_code_paragraph');
    personalCodeParagraph.innerHTML = personalCode
}

export const updateLocalVideo = (stream) => {
    const localVideo = document.getElementById('local_video')
    localVideo.srcObject = stream;
    localVideo.addEventListener('loadedmetadata', () => {
        localVideo.play()
    })
}

export const showVideoCallButtons = () => {
    const personalCodeVideoButton = document.getElementById('personal_code_video_button')
    const strangerVideoButton = document.getElementById('stranger_video_button')

    showElement(personalCodeVideoButton)
    showElement(strangerVideoButton)
}

export const updateRemoteVideo = (stream) => {
    const remoteVideo = document.getElementById('remote_video')
    remoteVideo.srcObject = stream;
}

export const showIncomingCallDialog = (callType, acceptCallHandler, rejectCallHandler) => {
    const callTypeInfo = callType === constant.callType.CHAT_PERSONAL_CODE ? 'Chat' : 'Video'

    const incomingCallDialog = elements.getIncomingCallDialog(callTypeInfo, acceptCallHandler, rejectCallHandler)
    const dialog = document.getElementById('dialog')
    dialog.querySelectorAll('*').forEach((dialog) => dialog.remove());
    dialog.appendChild(incomingCallDialog)
}

export const showCallingDialog = (rejectCallHandler) => {
    const callingDialog = elements.getCallingDialog(rejectCallHandler)

    const dialog = document.getElementById('dialog')
    dialog.querySelectorAll('*').forEach((dialog) => dialog.remove());
    dialog.appendChild(callingDialog)
}

export const showNoStrangerAvailableDialog = () => {
    const infoDialog = elements.getInfoDialog('No Stranger Available', 'Please Try Again Later')
    if (infoDialog) {
        const dialog = document.getElementById('dialog')
        dialog.appendChild(infoDialog)

        setTimeout(() => {
            removeDialogs()
        },[4000])
    }
}

export const showInfoDialog = (preOfferAnswer) => {
    let infoDialog = null;
    if (preOfferAnswer === constant.preOfferAnswer.CALL_REJECTED) {
        infoDialog = elements.getInfoDialog(
            'Call rejected',
            'Callee rejected your call'
        )
    }

    if (preOfferAnswer === constant.preOfferAnswer.CALLEE_NOT_FOUND) {
        infoDialog = elements.getInfoDialog(
            'Callee not found',
            'Please check personal code'
        )
    }

    if (preOfferAnswer === constant.preOfferAnswer.CALL_UNAVAILABLE) {
        infoDialog = elements.getInfoDialog(
            'Call is not possible',
            'Probably callee is busy. Please try again later'
        )
    }

    if (infoDialog) {
        const dialog = document.getElementById('dialog');
        dialog.appendChild(infoDialog)
        setTimeout(() => {
            removeDialogs();
        },[4000])
    }
}

export const removeDialogs = () => {
    const dialog = document.getElementById('dialog')
    dialog.querySelectorAll('*').forEach((dialog) => dialog.remove())
}

export const showCallElements = (callType) => {
    if (callType === constant.callType.CHAT_PERSONAL_CODE || callType === constant.callType.CHAT_STRANGER) {
        showChatCallElements();
    }

    if (callType === constant.callType.VIDEO_PERSONAL_CODE || callType === constant.callType.VIDEO_STRANGER) {
        showVideoCallElements();
    }
}   

const showChatCallElements = () => {
    const finishConnectChatButtonContainer = document.getElementById('finish_chat_button_container')
    showElement(finishConnectChatButtonContainer)

    const newMessageInput = document.getElementById('new_message')
    showElement(newMessageInput)

    disableDashboard();
}

const showVideoCallElements = () => {
    const callButtons = document.getElementById('call_buttons')
    showElement(callButtons)

    const placeholder = document.getElementById('videos_placeholder')
    hideElement(placeholder)

    const remoteVideo = document.getElementById('remote_video')
    showElement(remoteVideo)

    const newMessageInput = document.getElementById('new_message')
    showElement(newMessageInput)

    disableDashboard();
}

const micOnImgSrc = '../utils/Images/mic.png'
const micOffImgSrc = '../utils/Images/micOff.png'

export const updateMicButton = (micActive) => {
    const micButtonImage = document.getElementById('mic_button_image')
    micButtonImage.src = micActive ? micOffImgSrc : micOnImgSrc;
}

const cameraOnImgSrc = '../utils/Images/camera.png'
const cameraOffImgSrc = '../utils/Images/cameraOff.png'

export const updateCameraButton = (cameraActive) => {
    const cameraButtonImage = document.getElementById('camera_button_image')
    cameraButtonImage.src = cameraActive ? cameraOffImgSrc : cameraOnImgSrc;
}

export const appendMessage = (message, right = false) => {
    const messageContainer = document.getElementById('messages_container')
    const messageElement = right ? elements.getRightMessage(message) : elements.getLeftMessage(message)
    messageContainer.appendChild(messageElement)
}

export const clearMessenger = () => {
    const messageContainer = document.getElementById('messages_container')
    messageContainer.querySelectorAll('*').forEach((n) => n.remove())
}

export const showRecordingPanel = () => {
    const recordingButtons = document.getElementById('video_recording_buttons')
    showElement(recordingButtons)

    const startRecordingButton = document.getElementById('start_recording_button');
    hideElement(startRecordingButton);
}

export const resetRecordingButtons = () => {
    const startRecordingButton = document.getElementById('start_recording_button');
    const recordingButtons = document.getElementById('video_recording_buttons')

    hideElement(recordingButtons)
    showElement(startRecordingButton)
}

export const switchRecordingButton = (switchForResumeButton = false) => {
    const resumeButton = document.getElementById('resume_recording_button')
    const pauseButton = document.getElementById('pause_recording_button')

    if (switchForResumeButton) {
        hideElement(pauseButton)
        showElement(resumeButton)
    } else {
        hideElement(resumeButton)
        showElement(pauseButton)
    }
}

export const updateUIAfterHangUp = (callType) => {
    enableDashboard()
    if (callType === constant.callType.VIDEO_PERSONAL_CODE || callType === constant.callType.VIDEO_STRANGER) {
        const callButton = document.getElementById('call_buttons')
        hideElement(callButton)
    } else {
        const chatCallButton = document.getElementById('finish_chat_button_container')
        hideElement(chatCallButton)
    }
    const newMessageInput = document.getElementById('new_message')
    hideElement(newMessageInput)
    clearMessenger()

    updateMicButton(false)
    updateCameraButton(false)

    const placeholder = document.getElementById('videos_placeholder')
    showElement(placeholder)

    const remoteVideo = document.getElementById('remote_video')
    hideElement(remoteVideo)

    removeDialogs()
}

export const updateStrangerCheckbox = (allowConnection) => {
    const checkboxCheckImg = document.getElementById('allow_strangers_checkbox_image')
    
    allowConnection ? showElement(checkboxCheckImg) : hideElement(checkboxCheckImg)
}

const enableDashboard = () => {
    const dashboardBlocker = document.getElementById('dashboard_blur')
    if (!dashboardBlocker.classList.contains('display_none')) {
        dashboardBlocker.classList.add('display_none')
    }
}

const disableDashboard = () => {
    const dashboardBlocker = document.getElementById('dashboard_blur')
    if (dashboardBlocker.classList.contains('display_none')) {
        dashboardBlocker.classList.remove('display_none')
    }
}

const hideElement = (element) => {
    if (!element.classList.contains('display_none')) {
        element.classList.add('display_none')
    }
}

const showElement = (element) => {
    if (element.classList.contains('display_none')) {
        element.classList.remove('display_none')
    }
}

