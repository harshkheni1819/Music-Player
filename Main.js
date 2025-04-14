const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      document.body.classList.add('light-mode');
      document.getElementById('theme-toggle').textContent = 'Dark Mode';
    }

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLightMode = document.body.classList.contains('light-mode');
      themeToggle.textContent = isLightMode ? 'Dark Mode' : 'Light Mode';
    });

    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioElement = document.getElementById('audio-player');
    const audioSource = audioCtx.createMediaElementSource(audioElement);
    const analyser = audioCtx.createAnalyser();

    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function drawVisualizer() {
      canvas.style.display = 'block';
      requestAnimationFrame(drawVisualizer);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        ctx.fillStyle = 'rgba(30, 215, 96, 0.6)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    }

    audioElement.onplay = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      drawVisualizer();
    };

    const fileUpload = document.getElementById('file-upload');
    fileUpload.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        const audioURL = URL.createObjectURL(file);
        audioElement.src = audioURL;
        document.getElementById('song-title').textContent = file.name;
        document.getElementById('song-artist').textContent = "Unknown Artist";
        document.getElementById('song-album').textContent = "Unknown Album";
        addSongToPlaylist(file);
      }
    });

    const playlist = [];
    const playlistContainer = document.getElementById('playlist');

    function addSongToPlaylist(file) {
      const songItem = document.createElement('li');
      songItem.textContent = file.name;
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.classList.add('remove-song');
      removeButton.onclick = () => removeSongFromPlaylist(songItem, file);
      songItem.appendChild(removeButton);

      songItem.onclick = () => {
  audioElement.src = URL.createObjectURL(file);
  audioElement.play();
  document.getElementById('song-title').textContent = file.name;

  // Read metadata using jsmediatags
  jsmediatags.read(file, {
    onSuccess: function(tag) {
      const tags = tag.tags;
      document.getElementById('song-artist').textContent = tags.artist || "Unknown Artist";
      document.getElementById('song-album').textContent = tags.album || "Unknown Album";
    },
    onError: function(error) {
      console.log("Metadata error:", error);
      document.getElementById('song-artist').textContent = "Unknown Artist";
      document.getElementById('song-album').textContent = "Unknown Album";
    }
  });
};
      playlist.push(file);
      playlistContainer.appendChild(songItem);
    }

    function removeSongFromPlaylist(songItem, file) {
      const index = playlist.indexOf(file);
      if (index > -1) {
        playlist.splice(index, 1);
        playlistContainer.removeChild(songItem);
      }
    }

    const playButton = document.getElementById('play-button');
    playButton.addEventListener('click', function () {
      if (audioElement.paused) {
        audioElement.play();
        playButton.textContent = 'Pause';
      } else {
        audioElement.pause();
        playButton.textContent = 'Play';
      }
    });

    const volumeControl = document.getElementById('volume-control');
    volumeControl.addEventListener('input', function () {
      audioElement.volume = volumeControl.value / 100;
    });

    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');

    audioElement.addEventListener('timeupdate', function () {
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      progressBar.value = progress;
      currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
      durationDisplay.textContent = formatTime(audioElement.duration);
    });

    progressBar.addEventListener('input', function () {
      const newTime = (progressBar.value / 100) * audioElement.duration;
      audioElement.currentTime = newTime;
    });

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }