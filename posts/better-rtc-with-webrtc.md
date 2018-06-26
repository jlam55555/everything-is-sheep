For years, I've been trying to get at real time communication (RTC). The best I've done is using websockets, which work fairly well, but it requires a server. Now, setting up a Node.js server with socket.io isn't too bad, so that's not a problem.

The problem is for sending large amounts of data across in a short amount of time. I noticed this most with [the racing game][1] I've built, which usually has noticeable amounts of lag.

The problem is that the data always is sent to the server (from the controllers), re-processed, and sent out to the client (the monitor). What happens with WebRTC is the middleman&mdash; the server&mdash; is cut out of the picture, and the faster UDP protocol is used (as opposed to the more error-safe TCP protocol used in WebSockets).

Then what is WebRTC? WebRTC is a (relatively) new JavaScript protocol for peer-to-peer communication via simple APIs and no plugins. This means that the plugins that used to be necessary for high-quality and high-speed data streaming (especially Flash) are becoming a part of native JavaScript, as [most popular web browsers have widely adopted WebRTC standards][3].

The idea is similar to that of VoIP (Voice over IP). VoIP is an Internet-based phone call system that has been widely adopted due to its low-costs and use of existing Internet infrastructure. The first part of making a phone call over VoIP is the SIP (Session Initiation Protocol), which is a way of advertising availability on the phone network. Once the caller finds the callee over the SIP protocol, a handshake is made, initiating a direct (peer-to-peer) connection between the two phones for a fast connection.

---

### How it works

In the following description, "host" and "client" are used to distinguish two computers being connected via WebRTC ("peers"). However, this definition is arbitrary, and either host or client can add a stream that the other peer can view. The only difference is that the host initiates the handshake with `createOffer`, while the client answers the offer.

1. *Host:* **Obtain a stream of data.** A stream (or multiple streams) of data is used as the medium communicated by WebRTC. Usually, this is a video and/or audio stream (a MediaStream object), but it can be any valid stream. JavaScript makes this very easy using the `Navigator.getUserMedia()` function.
2. *Host and client:* **Match a host and a client via some signalling channel/protocol.** WebRTC doesn't include the initial SIP for connecting two clients. Some other messaging service, such as Websockets in a client-server model, must be made to find another computer to connect to and carry out the handshake communication.
3. *Host and client:* **Create `RTCPeerConnection` instances.** These are the objects used to carry out the WebRTC protocol. While support is pretty good in popular browsers, some Opera and Chrome versions require the webkit prefix (`webkitRTCPeerConnection`).
4. *Host and/or Client:* **Add streams to the WebRTC connection.** Either peer can use the `addStream()` function to add a stream to the connection.
5. *Host and/or Client:* **Handle stream.** Either peer can listen to the `onaddstream` function to receive streams on the connection.
 
 **Now, the media and basic objects have been set up. Next, the media two peers have to find a direct means of communication via the ICE framework.**

9. *Host:* **Handle ICE candidates and send to client.** Now, the client and host have to figure out how to obtain a direct connection between the two. This is done using the ICE framework, which abstracts away the navigation through network interfaces and ports to find the best method. The host receives the `onicecandidate` event for a potential ICE candidate, and sends it over the signalling channel to the client.
10. *Client:* **Handle ICE candidates sent by the host.** The client receives the ICE candidates via the signalling channel and adds them using the `addIceCandidate()` function.

 **The final steps are the WebRTC handshake.**

4. *Host:* **Create offer.** In order to establish a connection, both the host and the client need a pair of matching Session Description Protocol (SDP) descriptions: a local one (their own) and a remote one (the other one). The host creates their SDP description using `createdOffer()`, and sets it as their local SDP description using `setLocalDescription()`.
5. *Host*: **Send host's SDP description to client via signalling channel.**
6. *Client:* **Receive offer and create answer.** Via the signalling channel, the client receives host's SDP description, and sets it as the remote description with `setRemoteDescription()`. Then, they create an "answer" to the offer with `createAnswer()`&mdash; this creates their local SDP description, which they set using `setLocalDescription()`.
7. *Client:* **Send client's SDP description to host via signalling channel.**
8. *Host:* **Receive answer.** Via the signalling channel, the host receives the answer (the client's SDP description) and sets it as the remote description using `setRemoteDescription()`.

 **By this point, both host and client share a common pair of SDP descriptions, and the handshake is complete.**

  **Now, the connection should be complete.**

That seems like a lot already, but all the hard work has already been abstracted away in the ICE framework and the `RTCPeerConnection` object.

---

In summary, here's a linear representation of the entire process (you can copy-and-paste this to run on any web server):

    /*
      SET UP MEDIA AND RTCPEERCONNECTION OBJECTS
      STEPS 1-5
      note that createOffer (in the handshake) must occur after addStream() (in this section). More details here: https://stackoverflow.com/questions/27489881/webrtc-never-fires-onicecandidate/27758788#27758788
    */
    /* step 1: host: obtain a stream of data */
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })
      .then(hostBeginRTC)
      .catch(handleError);

    /*
      step 2: host and client: match a host and a client via some signalling channel/protocol
      (here there is no signalling channel, so the other pc's functions will be called for simplicity)
    */

    /* step 3: host and client: create RTCPeerConnection objects */
    let pc1 = new RTCPeerConnection();
    let pc2 = new RTCPeerConnection();

    /* step 4: (host): add stream to the WebRTC connectionn */
    function hostBeginRTC(stream) {
      pc1.addStream(stream);

      // also show in "input" video element
      videoPlayer1.srcObject = stream;

      // handshake
      handshake();
    }

    /* step 5: (client): handle stream */
    pc2.onaddstream = event => {
      // show in "output" video element
      videoPlayer2.srcObject = event.stream;
    }

    /*
      HANDLE ICE CANDIDATES
      STEPS 6-7
      note that ice candidates are generated when setLocalDescription() (in the handshake) is called
    */

    /* step 6: host: handle ICE candidates and send to client */
    pc1.onicecandidate = event => {
      /* step 7: client: handle ice candidates sent by the host */
      if(event.candidate !== null)
        pc2.addIceCandidate(event.candidate)
          .catch(handleError);
    }

    /*
      ESTABLISH THE HANDSHAKE
      STEPS 8-12
    */
    function handshake() {
      /* step 8: host: create offer */
      pc1.createOffer()
        .then(offer => {
          pc1.setLocalDescription(offer)
            .catch(handleError);

          /* step 9: host: send host's SDP description to client via signalling channel */
          pc2.setRemoteDescription(offer)
            .catch(handleError);

          /* step 10: client: receive offer and create answer */
          pc2.createAnswer()
            .then(answer => {
              
              /* step 11: client: send client's SDP offer and create answer */
              pc2.setLocalDescription(answer);

              /* step 12: host: receive answer */
              pc1.setRemoteDescription(answer)
                .catch(handleError);

            });
        });
    }

---

### Resources

- For a more in-depth introduction to WebRTC, there is a [great article by HTML5 Rocks][4], from where I got learnt most of this information.
- However, some of the code snippets use deprecated functions, so it might be a good idea to check out the [MDN documentation on `RTCPeerConnection`][5] as well.
- The WebRTC website has [many informative samples][6].
- The code above can be found at [@jlam55555/webrtc-test on GitHub][7].

---

### Notes

- Unfortunately, I haven't yet implemented WebRTC in my applications yet, such as the multiplayer racing game, and the performance gain is theoretical. The benefits of WebRTC are described in more depth on [this Stack Overflow answer][2].)
- This post was updated on 6/25/18 with a working example


[1]: https://racing-game-csp.herokuapp.com/
[2]: https://stackoverflow.com/a/18805578/2397327
[3]: https://caniuse.com/#search=webrtc
[4]: https://www.html5rocks.com/en/tutorials/webrtc/basics/
[5]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
[6]: https://webrtc.github.io/samples/
[7]: https://github.com/jlam55555/webrtc-test
