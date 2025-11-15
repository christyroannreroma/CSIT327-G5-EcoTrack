// login.js - simple password visibility toggle and small helpers
document.addEventListener('DOMContentLoaded', function(){
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
});