document.addEventListener("DOMContentLoaded", function () {
  const supportForm = document.getElementById("supportForm");

  supportForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    //Form Submitted
    console.log("Form submitted!");

    // Redirect to the "Thank You" page
    window.location.href = "thankyou.html";
  });
});