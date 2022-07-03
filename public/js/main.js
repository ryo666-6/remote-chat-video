import * as store from './store.js'
import * as wss from './wss.js'
import * as webRTCHandler from './webRTCHandler.js'
import * as constant from './constant.js'
import * as ui from './ui.js'
import * as recordingUtils from './recordingUtils.js'
import * as strangerUtils from './strangerUtils.js'

const socket = io('/');
wss.registerSocketEvents(socket)

webRTCHandler.getLocalPreview()

//register event listener for personal copy button
const personalCodeCopyButton = document.getElementById('personal_code_copy_button')
personalCodeCopyButton.addEventListener('click', () => {
    const personalCode = store.getState().socketId
    navigator.clipboard && navigator.clipboard.writeText(personalCode);
})

//register event listener for connection buttons
const personalCodeChatButton = document.getElementById('personal_code_chat_button')
const personalCodeVideoButton = document.getElementById('personal_code_video_button')

personalCodeChatButton.addEventListener('click', () => {
    const calleePersonalCode = document.getElementById('personal_code_input').value
    const callType = constant.callType.CHAT_PERSONAL_CODE
    webRTCHandler.sendPreOffer(callType, calleePersonalCode)
})

personalCodeVideoButton.addEventListener('click', () => {
    const calleePersonalCode = document.getElementById('personal_code_input').value
    const callType = constant.callType.VIDEO_PERSONAL_CODE;
    webRTCHandler.sendPreOffer(callType, calleePersonalCode)
})

const strangerChatButton = document.getElementById('stranger_chat_button')
strangerChatButton.addEventListener('click', () => {
    strangerUtils.getStrangerSocketIdAndConnect(constant.callType.CHAT_STRANGER)
})

const strangerVideoButton = document.getElementById('stranger_video_button')
strangerVideoButton.addEventListener('click', () => {
    strangerUtils.getStrangerSocketIdAndConnect(constant.callType.VIDEO_STRANGER)
})

const checkbox = document.getElementById('allow_strangers_checkbox')
checkbox.addEventListener('click', () => {
    const checkboxState = store.getState().allowConnectionFromStrangers
    ui.updateStrangerCheckbox(!checkboxState)
    store.setAllowConnectionFromStrangers(!checkboxState)
    strangerUtils.changeStrangerConnectionStatus(!checkboxState)
})

const mibButton = document.getElementById('mic_button')
mibButton.addEventListener('click', () => {
    const localStream = store.getState().localStream;
    const micEnabled = localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = !micEnabled;
    ui.updateMicButton(micEnabled)
})

const cameraButton = document.getElementById('camera_button')
cameraButton.addEventListener('click', () => {
    const localStream = store.getState().localStream;
    const cameraEnabled = localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = !cameraEnabled
    ui.updateCameraButton(cameraEnabled)
})

const switchScreenSharingButton = document.getElementById('screen_sharing_button')
switchScreenSharingButton.addEventListener('click', () => {
    const screenSharingActive = store.getState().screenSharingActive
    webRTCHandler.switchBetweenCameraScreenSharing(screenSharingActive)
})

const newMessageInput = document.getElementById('new_message_input')
newMessageInput.addEventListener('keydown', (e) => {
    const key = e.key
    if (key === 'Enter') {
        webRTCHandler.sendMessageUsingDataChannel(e.target.value)
        ui.appendMessage(e.target.value, true)
        newMessageInput.value = ''
    }
})

const sendMessageButton = document.getElementById('send_message_button')
sendMessageButton.addEventListener('click', () => {
    const message = newMessageInput.value
    webRTCHandler.sendMessageUsingDataChannel(message)
    ui.appendMessage(message, true)
    newMessageInput.value = ''
})

const startRecordingButton = document.getElementById('start_recording_button')
startRecordingButton.addEventListener('click', () => {
    recordingUtils.startRecording()
    ui.showRecordingPanel()
})

const stopRecordingButton = document.getElementById('stop_recording_button')
stopRecordingButton.addEventListener('click', () => {
    recordingUtils.stopRecording()
    ui.resetRecordingButtons()
})

const pauseRecordingButton = document.getElementById('pause_recording_button')
pauseRecordingButton.addEventListener('click', () => {
    recordingUtils.pauseRecording();
    ui.switchRecordingButton(true)
})

const resumeRecordingButton = document.getElementById('resume_recording_button')
resumeRecordingButton.addEventListener('click', () => {
    recordingUtils.resumeRecording()
    ui.switchRecordingButton()
})

const hangUpButton = document.getElementById('hang_up_button')
hangUpButton.addEventListener('click', () => {
    webRTCHandler.handleHangUp()
})

const hangUpChatButton = document.getElementById('finish_chat_call_button')
hangUpChatButton.addEventListener('click', () => {
    webRTCHandler.handleHangUp()
})