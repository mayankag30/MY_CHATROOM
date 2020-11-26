const { addListener } = require("nodemon");

const users = []

// addUser, removeUser, getUser, getUsersRoom

const addUser = ({ id, username, room }) => {
    // Clean the data - convert to lowercase and trim the extra spaces and validate
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        };
    }

    // Name is unique for a particular Room 
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    });

    // Validate Username
    if (existingUser) {
        return {
            error: 'username is in use'
        };
    }

    // Add/Store the user
    const user = { id, username, room };
    users.push(user);
    return { user }; 

};

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if (index != -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = (id) => {
    return users.find((user) => {
        return user.id === id;
    });
}

const getUsersRoom = (room) => {
    room = room.trim().toLowerCase();

    return users.filter((user) => {
        return user.room === room;
    });
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersRoom,
};