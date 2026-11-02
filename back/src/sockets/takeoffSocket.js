module.exports = function setupTakeoffSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    socket.on('join_takeoff_board', () => socket.join('takeoff_board'));
    socket.on('join_build_detail', ({ buildId }) => socket.join(`build_${buildId}`));
    socket.on('join_user', ({ userId }) => socket.join(`user_${userId}`));
    socket.on('leave_build_detail', ({ buildId }) => socket.leave(`build_${buildId}`));
    socket.on('disconnect', () => console.log(`[Socket] Disconnected: ${socket.id}`));
  });
};