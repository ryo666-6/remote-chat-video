import * as wss from './wss.js'
import * as constant from './constant.js'
import * as ui from './ui.js'
import  * as store from './store.js'

let connectedUserDetails;
let peerConnection;
let dataChannel;

const defaultConstraints = {
    audio: true,
    video: true
}

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.1.google.com:13902'
        }
    ]
}

export const getLocalPreview = () => {
    navigator.mediaDevices.getUserMedia(defaultConstraints)
        .then((stream) => {
            ui.updateLocalVideo(stream);
            ui.showVideoCallButtons()
            store.setCallState(constant.callState.CALL_AVAILABLE)
            store.setLocalStream(stream)
        })
        .catch((err) => {
            console.log('error ocurred when trying to get an access to camera');
            console.log(err);
    })
}

const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection(configuration);
    dataChannel = peerConnection.createDataChannel('chat')

    peerConnection.ondatachannel = e => {
        const dataChannel = e.channel
        
        dataChannel.onopen = () => {
            console.log('peer connection is ready to receive data channel message.');
        }
        dataChannel.onmessage = e => {
            const message = JSON.parse(e.data)
            ui.appendMessage(message)
        }
    }

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            wss.sendDataUsingWebRTCSignaling({
                connectedUserSocketId: connectedUserDetails.socketId,
                type: constant.webRTCSignaling.ICE_CANDIDATE,
                candidate: e.candidate,
            })
        }
    }

    const remoteStream = new MediaStream()

    store.setRemoteStream(remoteStream)
    ui.updateRemoteVideo(remoteStream)

    peerConnection.ontrack = (e) => {
        remoteStream.addTrack(e.track)
    }

    if (connectedUserDetails.callType === constant.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constant.callType.VIDEO_STRANGER) {
        const localStream = store.getState().localStream
        for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream)
        }
    }
}

export const sendMessageUsingDataChannel = (message) => {
    const stringifiedMessage = JSON.stringify(message)
    dataChannel.send(stringifiedMessage)
}

export const sendPreOffer = (callType, calleePersonalCode) => {
    connectedUserDetails = {
        callType,
        socketId: calleePersonalCode
    }

    if (callType === constant.callType.CHAT_PERSONAL_CODE || callType === constant.callType.VIDEO_PERSONAL_CODE) {
        const data = {
            callType,
            calleePersonalCode
        }
        ui.showCallingDialog(callingDialogRejectCallHandler)
        store.setCallState(constant.callState.CALL_UNAVAILABLE)
        wss.sendPreOffer(data)
    }
    if (callType === constant.callType.CHAT_STRANGER || callType === constant.callType.VIDEO_STRANGER) {
        const data = {
            callType,
            calleePersonalCode
        }
        store.setCallState(constant.callState.CALL_UNAVAILABLE)
        wss.sendPreOffer(data)
    }
}

const sendPreOfferAnswer = (preOfferAnswer, callerSocketId = null) => {
    const socketId = callerSocketId ? callerSocketId : connectedUserDetails.socketId
    const data = {
        callerSocketId: socketId,
        preOfferAnswer
    }
    ui.removeDialogs()
    wss.sendPreOfferAnswer(data)
}

export const handlePreOffer = (data) => {
    const { callType, callerSocketId } = data

    if (!checkCallPossibility()) {
        return sendPreOfferAnswer(constant.preOfferAnswer.CALL_UNAVAILABLE, callerSocketId)
    } 

    connectedUserDetails = {
        socketId: callerSocketId,
        callType
    }

    store.setCallState(constant.callState.CALL_UNAVAILABLE)

    if(callType === constant.callType.CHAT_PERSONAL_CODE || callType === constant.callType.VIDEO_PERSONAL_CODE) {
        ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler)
    }

    if (callType === constant.callType.CHAT_STRANGER || callType === constant.callType.VIDEO_STRANGER) {
        createPeerConnection()
        sendPreOfferAnswer(constant.preOfferAnswer.CALL_ACCEPTED)
        ui.showCallElements(connectedUserDetails.callType)
    }
}

const acceptCallHandler = () => {
    createPeerConnection()
    sendPreOfferAnswer(constant.preOfferAnswer.CALL_ACCEPTED)
    ui.showCallElements(connectedUserDetails.callType)
}

const rejectCallHandler = () => {
    setIncomingCallsAvailable()
    sendPreOfferAnswer()
    sendPreOfferAnswer(constant.preOfferAnswer.CALL_REJECTED)
}

const callingDialogRejectCallHandler = () => {
    const data = {
        connectedUserSocketId: connectedUserDetails.socketId,
    }
    closePeerConnectionAndResetState()

    wss.sendUserHangedUp(data)
}

export const handlePreOfferAnswer = (data) => {
    const { preOfferAnswer } = data
    ui.removeDialogs();
    if (preOfferAnswer === constant.preOfferAnswer.CALLEE_NOT_FOUND) {
        setIncomingCallsAvailable()
        ui.showInfoDialog(preOfferAnswer)
    }

    if (preOfferAnswer === constant.preOfferAnswer.CALL_UNAVAILABLE) {
        setIncomingCallsAvailable()
        ui.showInfoDialog(preOfferAnswer)
    }

    if (preOfferAnswer === constant.preOfferAnswer.CALL_REJECTED) {
        setIncomingCallsAvailable()
        ui.showInfoDialog(preOfferAnswer)
    }

    if (preOfferAnswer === constant.preOfferAnswer.CALL_ACCEPTED) {
        ui.showCallElements(connectedUserDetails.callType);
        createPeerConnection();
        sendWebRTCOffer();
    }
}

const sendWebRTCOffer = async () => {
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constant.webRTCSignaling.OFFER,
        offer: offer
    });
}

export const handleWebRTCOffer = async (data) => {
    await peerConnection.setRemoteDescription(data.offer)
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer)
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constant.webRTCSignaling.ANSWER,
        answer: answer
    })
}

export const handleWebRTCAnswer = async (data) => {
    await peerConnection.setRemoteDescription(data.answer)
}

export const handleWebRTCCandidate = async (data) => {
    try {
        await peerConnection.addIceCandidate(data.candidate) 
    } catch (err) {
        console.log('error occured when trying to add received ice candidate', err);
    }
}

let screenSharingStream;
export const switchBetweenCameraScreenSharing = async (screenSharingActive) => {
    if (screenSharingActive) {
        const localStream = store.getState().localStream
        const senders = peerConnection.getSenders()
        const sender = senders.find((sender) => { 
            return (
                sender.track.kind === localStream.getVideoTracks()[0].kind
            )    
        })

        if (sender) {
            sender.replaceTrack(localStream.getVideoTracks()[0])
        }

        store.getState().screenSharingStream.getTracks().forEach((track) => track.stop())

        store.setScreenSharingActive(screenSharingActive)
        ui.updateLocalVideo(localStream)
    } else {
        try {
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            })
            store.setScreenSharingStream(screenSharingStream)
            const senders = peerConnection.getSenders()
            const sender = senders.find((sender) => { 
                return (
                    sender.track.kind === screenSharingStream.getVideoTracks()[0].kind
                )    
            })

            if (sender) {
                sender.replaceTrack(screenSharingStream.getVideoTracks()[0])
            }

            store.setScreenSharingActive(!screenSharingActive)
            ui.updateLocalVideo(screenSharingStream)
        } catch(err) {
            console.log('error occured when trying to get screen sharing stream', err);
        }
    }
}

export const handleHangUp = () => {
    const data = {
        connectedUserSocketId: connectedUserDetails.socketId
    }
    wss.sendUserHangedUp(data)
    closePeerConnectionAndResetState()
}

export const handleConnectedUserHangedUp = () => {
    closePeerConnectionAndResetState()
}

const closePeerConnectionAndResetState = () => {
    if (peerConnection) {
        peerConnection.close()
        peerConnection = null
    }
    if (connectedUserDetails.callType === constant.callType.VIDEO_PERSONAL_CODE || connectedUserDetails.callType === constant.callType.VIDEO_STRANGER) {
        store.getState().localStream.getVideoTracks()[0].enabled = true
        store.getState().localStream.getAudioTracks()[0].enabled = true
    }
    ui.updateUIAfterHangUp(connectedUserDetails.callType)
    setIncomingCallsAvailable()
    connectedUserDetails = null
}

const checkCallPossibility = (callType) => {
    const callState = store.getState().callState;
    if (callState === constant.callState.CALL_AVAILABLE) {
        return true;
    }
    if (
        (callType === constant.callType.VIDEO_PERSONAL_CODE ||
        callType === constant.callType.VIDEO_STRANGER) &&
        callState === constant.callState.CALL_AVAILABLE_ONLY_CHAT
    ) {
        return false
    }
    return false
}

const setIncomingCallsAvailable = () => {
    const localStream = store.getState().localStream;
    if (localStream) {
        store.setCallState(constant.callState.CALL_AVAILABLE)
    } else {
        store.setCallState(constant.callState.CALL_AVAILABLE_ONLY_CHAT)
    }
}