const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild;

    // Height of the new Message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Messages Container Height
    const ContainerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    // auto scroll condition
    if (ContainerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// Listening for messages (Not the LOCATION)
socket.on('message', (msg) => {
    console.log(msg);

    // Compile our template with the data we want to render inside it
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        newMessage: msg.text,
        createdAt: moment(msg.createdAt).format('hh:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// Listening for LOCATION MESSAGES
socket.on('locationMessage', (loc) => {
    console.log(loc.url);

    const html = Mustache.render(locationTemplate, {
        username: loc.username,
        myLocation: loc.url,
        createdAt: moment(loc.createdAt).format('hh:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// Listening for Updating the SIDEBAR
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})

// Emitting messages to server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disable the form
    $messageFormButton.setAttribute('disabled', 'disabled'); // disables the form once it is submitted
    
    const message = e.target.elements.messagein.value;
    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        // Enable
        if (error) {
            return console.log(error);
        }

        console.log('Message Delivered!');
    });
});

// Emitting the location latitude and longitude to the server
$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geo Location is not supported by your browser');
    }

    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            'lat': position.coords.latitude,
            'long': position.coords.longitude
        }, () => {

            $locationButton.removeAttribute('disabled');
            console.log("Location Shared");
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
});

// server (emit) -> client(recieve) - acknowledgement --> server
// client (emit) -> server(recieve) - acknowledgement --> client