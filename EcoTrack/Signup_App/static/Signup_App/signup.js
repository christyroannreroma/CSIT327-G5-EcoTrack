// signup.js - password visibility toggle and simple validation
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

  // Simple client-side validation
  const form = document.querySelector('form');
  if(form){
    form.addEventListener('submit', function(e){
      const username = document.getElementById('id_username').value.trim();
      const password = document.getElementById('id_password').value;
      const confirm = document.getElementById('id_confirm_password').value;
      let errors = [];
      if(!username) errors.push('Username is required.');
      if(!password) errors.push('Password is required.');
      if(password !== confirm) errors.push('Passwords do not match.');
      if(errors.length){
        e.preventDefault();
        let ul = document.querySelector('.messages');
        if(!ul){
          ul = document.createElement('ul');
          ul.className = 'messages';
          form.prepend(ul);
        }
        ul.innerHTML = '';
        errors.forEach(msg => {
          const li = document.createElement('li');
          li.className = 'error';
          li.textContent = msg;
          ul.appendChild(li);
        });
      }
    });
  }
});