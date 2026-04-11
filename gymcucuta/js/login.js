function togglePass() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const user = document.getElementById('usuario').value.trim();
  const pass = document.getElementById('password').value;
  const err = document.getElementById('errorMsg');

  if (user === 'admin' && pass === '1234') {
    sessionStorage.setItem('gymLoggedIn', 'true');
    sessionStorage.setItem('gymUser', user);
    window.location.href = 'inicio.html';
  } else {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
});
