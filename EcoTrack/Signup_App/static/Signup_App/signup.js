// signup.js - password visibility toggle and enhanced validation
document.addEventListener('DOMContentLoaded', function(){
  // Password toggle
  const toggleButtons = document.querySelectorAll('.pw-toggle');
  toggleButtons.forEach(btn => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if(!input) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      if(input.type === 'password'){
        input.type = 'text';
        btn.setAttribute('aria-pressed','true');
        btn.textContent = 'Hide';
      } else {
        input.type = 'password';
        btn.setAttribute('aria-pressed','false');
        btn.textContent = 'Show';
      }
    });
  });

  // Show password validation warnings as user types
  function validatePassword() {
    const passwordInput = document.getElementById('id_password');
    const confirmInput = document.getElementById('id_confirm_password');
    if(!passwordInput || !confirmInput) return;

    const password = passwordInput.value;
    const confirm = confirmInput.value;
    let errors = [];
    if(password.length && password.length < 8){
      errors.push('Password must be at least 8 characters long.');
    }
    if(password.length && !/[A-Z]/.test(password)){
      errors.push('Password must contain at least one uppercase letter.');
    }
    if(password.length && !/[a-z]/.test(password)){
      errors.push('Password must contain at least one lowercase letter.');
    }
    if(password.length && !/[0-9]/.test(password)){
      errors.push('Password must contain at least one number.');
    }
    if(password.length && !/[-!@#$%^&*(),.?":{}|<>]/.test(password)){
      errors.push('Password must contain at least one symbol.');
    }
    if(confirm.length && password !== confirm){
      errors.push('Passwords do not match.');
    }
    showWarnings(errors);
  }

  function showWarnings(errors){
    let ul = document.getElementById('client-messages');
    if(!ul){
      ul = document.createElement('ul');
      ul.className = 'messages';
      ul.id = 'client-messages';
      document.querySelector('form').prepend(ul);
    }
    if(errors.length){
      ul.style.display = '';
      ul.innerHTML = '';
      errors.forEach(msg => {
        const li = document.createElement('li');
        li.className = 'error';
        li.textContent = msg;
        ul.appendChild(li);
      });
    } else {
      ul.style.display = 'none';
      ul.innerHTML = '';
    }
  }

  // Listen for input events on password fields
  const passwordInput = document.getElementById('id_password');
  const confirmInput = document.getElementById('id_confirm_password');
  if(passwordInput) passwordInput.addEventListener('input', validatePassword);
  if(confirmInput) confirmInput.addEventListener('input', validatePassword);

  // Enhanced client-side validation on submit
  const form = document.querySelector('form');
  if(form){
    form.addEventListener('submit', function(e){
      const usernameInput = document.getElementById('id_username');
      const passwordInput = document.getElementById('id_password');
      const confirmInput = document.getElementById('id_confirm_password');
      if(!usernameInput || !passwordInput || !confirmInput) return;

      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      let errors = [];
      if(!username) errors.push('Username is required.');
      if(!password) errors.push('Password is required.');
      if(password !== confirm) errors.push('Passwords do not match.');

      // Password strength validation
      if(password){
        if(password.length < 8){
          errors.push('Password must be at least 8 characters long.');
        }
        if(!/[A-Z]/.test(password)){
          errors.push('Password must contain at least one uppercase letter.');
        }
        if(!/[a-z]/.test(password)){
          errors.push('Password must contain at least one lowercase letter.');
        }
        if(!/[0-9]/.test(password)){
          errors.push('Password must contain at least one number.');
        }
        if(!/[!@#$%^&*(),.?":{}|<>]/.test(password)){
          errors.push('Password must contain at least one symbol.');
        }
      }

      if(errors.length){
        e.preventDefault();
        showWarnings(errors);
      }
    });
  }
});