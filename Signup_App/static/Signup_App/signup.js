document.addEventListener('DOMContentLoaded', function(){
  // Password / visibility toggle (unchanged)
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

  // practical email regex (not full RFC)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  // client messages UL (exists in template)
  let clientMessages = document.getElementById('client-messages');

  function showWarnings(errors){
    let ul = clientMessages;
    if(!ul){
      ul = document.createElement('ul');
      ul.className = 'messages';
      ul.id = 'client-messages';
      document.querySelector('form').prepend(ul);
      clientMessages = ul;
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

  // validate inputs: show email-format warning only after user touched the email field
  let emailTouched = false;

  function validateInputs() {
    const emailInput = document.getElementById('id_email');
    const passwordInput = document.getElementById('id_password');
    const confirmInput = document.getElementById('id_confirm_password');
    if(!passwordInput || !confirmInput || !emailInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    let errors = [];

    // Email client validation: only if user has touched the email field and typed something
    if(emailTouched && email.length){
      if(!emailRegex.test(email)){
        errors.push('Please enter a valid email address.');
      }
    }

    // Password checks (only when user typed something)
    if(password.length){
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

    // Confirm match
    if(confirm.length && password !== confirm){
      errors.push('Passwords do not match.');
    }

    showWarnings(errors);
  }

  // debounce helper
  function debounce(fn, wait = 150){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // single debounced validator instance (avoid recreating on every input)
  const debouncedValidate = debounce(validateInputs, 150);

  // wire inputs
  const emailInput = document.getElementById('id_email');
  const passwordInput = document.getElementById('id_password');
  const confirmInput = document.getElementById('id_confirm_password');

  if(emailInput){
    // mark touched when user focuses or types
    emailInput.addEventListener('focus', () => { emailTouched = true; });
    emailInput.addEventListener('input', () => { emailTouched = true; debouncedValidate(); });
    emailInput.addEventListener('blur', debouncedValidate);
  }
  if(passwordInput) passwordInput.addEventListener('input', debouncedValidate);
  if(confirmInput) confirmInput.addEventListener('input', debouncedValidate);

  // Enhanced client-side validation on submit (email-format checked on submit if provided)
  const form = document.querySelector('form');
  if(form){
    form.addEventListener('submit', function(e){
      const usernameInput = document.getElementById('id_username');
      const emailInput = document.getElementById('id_email');
      const passwordInput = document.getElementById('id_password');
      const confirmInput = document.getElementById('id_confirm_password');
      if(!usernameInput || !emailInput || !passwordInput || !confirmInput) return;

      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      let errors = [];

      if(!username) errors.push('Username is required.');
      if(!email) errors.push('Email is required.');
      else if(!emailRegex.test(email)) errors.push('Please enter a valid email address.');
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
        const first = document.querySelector('.messages .error');
        if(first) {
          window.scrollTo({ top: Math.max(0, document.querySelector('form').offsetTop - 20), behavior: 'smooth' });
        }
      }
    });
  }
});