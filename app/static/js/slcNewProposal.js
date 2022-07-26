import searchUser from './searchUser.js'

function saveCourseData(url, successCallback) {
    if (!validateForm()) return false;

    var formdata = $("form").serialize()
    var instructordata = $.param({"instructor":getCourseInstructors()})
    $.ajax({
        url: url,
        type: "POST",
        data: formdata + "&" + instructordata,
        success: successCallback,
        error: function(request, status, error) {
         msgFlash("Error saving changes!", "danger")
       }
  });
}

function showTab(currentTab) {
  // function that displays the specified tab of the form
  let allTabs = $(".tab");
  $(allTabs[currentTab]).css("display", "block");

  switch(currentTab) {
    case 0: // First page
        $("#cancelButton").show();
        $("#previousButton").css("display", "none");
        $("#approveButton").hide();
        $("#nextButton").text("Next");
        $("#saveContinue").hide();
        break;
    case 1: // Second page
        $("#cancelButton").hide();
        $("#previousButton").css("display", "inline");
        $("#approveButton").hide();
        $("#nextButton").hide();
        $("#saveContinue").show();
        break;
    case 2: // Third page
        $("#cancelButton").hide();
        $("#previousButton").css("display", "inline");
        $("#approveButton").show();
        $("#nextButton").text("Submit");
        $("#nextButton").show();
        $("#saveContinue").text("Save For Later");
        break;
    }

  fixStepIndicator(currentTab)
}

function fixStepIndicator(navigateTab) {
  // This function updates the active step indicator
  let steps = $(".step");
  steps.each((i, step) => $(step).removeClass("active"));
  $(steps[navigateTab]).addClass("active")
}

function displayCorrectTab(navigateTab) {
  // This function will figure out which tab to display
  let allTabs = $(".tab");
  if (navigateTab == 1 && !validateForm()) return false;
  if(currentTab != (allTabs.length - 1) || (navigateTab == -1)){
      $(allTabs[currentTab]).css("display", "none");
  }

  // Increase or decrease the current tab by 1:
  currentTab = currentTab + navigateTab;

  if (currentTab >= allTabs.length) {
      $("#nextButton").prop("disabled", true)
      addInstructorsToForm()
      $("#slcNewProposal").submit();
      return false;
  }
  showTab(currentTab);
}

function addInstructorsToForm() {
    var form = $("#slcNewProposal");
    $.each(getCourseInstructors(), function(idx,username) {
        form.append($("<input type='hidden' name='instructor[]' value='" + username + "'>"));
    });
}

function validateForm() {
  // TODO: Generalize form validation to include textareas and selects
  // This function deals with validation of the form fields
  let valid = true;
  var url = String(window.location.href);
  if (!url.includes("view")){
      let allTabs = $(".tab");
      let allInputs = $(allTabs[currentTab]).find("input");
      for (let i = 0; i < allInputs.length; i++) {
        if (allInputs[i].required) {
          if (!allInputs[i].value){
            allInputs[i].className += " invalid";
            valid = false;
          } else {
            allInputs[i].className = "form-control";
          }
        }
      }

      var instructors = getCourseInstructors()
      if (!instructors.length && currentTab == 1) {
        valid = false;
        $("#courseInstructor").addClass("invalid");
      } else {
        $("#courseInstructor").removeClass("invalid");
      }
      if (valid) {
        $(".step")[currentTab].className += " finish";
      }
  }
  return valid;
};

function getRowUsername(element) {
    return $(element).closest("tr").data("username")
}
function focusHandler(event) {
    var username=getRowUsername(this)
    $("#editButton-" + username).html('Save');
}
function blurHandler(event) {
    var username=getRowUsername(this)
    var editBtn = $("#editButton-" + username)
    if($(event.relatedTarget).attr("id") != editBtn.attr("id")) {
        editBtn.html('Edit');
    }
}
function createNewRow(selectedInstructor) {
  let instructor = (selectedInstructor["firstName"]+" "+selectedInstructor["lastName"]+" ("+selectedInstructor["email"]+")");
  let username = selectedInstructor["username"];
  let phone = selectedInstructor["phoneNumber"];
  let tableBody = $("#instructorTable").find("tbody");
  if(tableBody.prop('outerHTML').includes(instructor)){
    msgFlash("Instructor is already added.", "danger");
    return;
  }
  // Create new table row and update necessary attributes
  let lastRow = tableBody.find("tr:last");
  let newRow = lastRow.clone();

  let instructorName = newRow.find("td:eq(0) p")
  instructorName.text(instructor);

  let phoneInput = newRow.find("td:eq(0) input")
  phoneInput.val(phone);
  phoneInput.attr("id", "inputPhoneNumber-" +username);
  $(phoneInput).focus(focusHandler);
  $(phoneInput).focusout(blurHandler);
  $(phoneInput).inputmask('(999)-999-9999');

  let removeButton = newRow.find("td:eq(1) button")
  let editLink = newRow.find("td:eq(0) a")
  editLink.attr("id", "editButton-" + username);

  newRow.attr("data-username", username)
  newRow.prop("hidden", false);
  lastRow.after(newRow);
}

function getCourseInstructors() {
  // get usernames out of the row
  return $("#instructorTable tr")
                .map((i,el) => $(el).data('username')).get()
                .filter(val => (val))
}

function disableInput() {
    $("input").prop("disabled", true);
    $("select").prop("disabled", true);
    $("textarea").prop("disabled", true);
    $(".view").prop("disabled", true);
    $("#approveButton").hide();
}

var currentTab = 0; // Current tab is set to be the first tab (0)

$(document).ready(function(e) {
    // set up the current tab and button state
    showTab(currentTab); 

    // Update display if we are viewing only
    if (window.location.href.includes("view")){
        disableInput()
    }

    // set up phone numbers
    $("input[name=courseInstructorPhone]").inputmask('(999)-999-9999');


    // Add button event handlers
    // -----------------------------------------
    $("#previousButton").on("click", function() {
        displayCorrectTab(-1);
    });

    $("#nextButton").on("click", function() {
        displayCorrectTab(1);
    });

    $("#cancelButton").on("click", function() {
        window.location.replace($(this).val());
    });
  
    $("#saveContinue").on("click", function() {
        //this will save the change from the current page and move to the next page
        saveCourseData("/serviceLearning/saveProposal", function() {
            let allTabs = $(".tab");
            if (currentTab == (allTabs.length - 2)) {
              displayCorrectTab(1);
            }
            else if (currentTab == (allTabs.length - 1)){
              window.location.replace("/serviceLearning/courseManagement");
            }
            msgFlash("Changes saved!", "success")
        });
    });

    $("#submitAndApproveButton").click(function(){
        $("#submitAndApproveButton").prop("disabled", true)
        saveCourseData("/serviceLearning/approveCourse", function(response) {
            window.location.replace("/manageServiceLearning")
        })
    });

    // Add course instructor event handlers
    // -----------------------------------------
    $("#instructorTable").on("click", "#remove", function() {
        $(this).closest("tr").remove();
    });
    $("#courseInstructor").on('input', function() {
        searchUser("courseInstructor", createNewRow, true, null, "instructor");
    });
    $("input[name=courseInstructorPhone]").focus(focusHandler);
    $("input[name=courseInstructorPhone]").focusout(blurHandler);
    $('#instructorTable').on('click', ".editButton", function() {
        var username=getRowUsername(this)
        if ($(this).html() === 'Edit') {
            $(this).html('Save')
            $("#inputPhoneNumber-"+ username).focus()
        } else {
            // Save the phone number
            var phoneInput = $("#inputPhoneNumber-" + username);
            let isvalid = phoneInput.val().replace(/\D/g,"").length === 10;
            let isempty = phoneInput.val().replace(/\D/g,"").length === 0;
            if (!(isvalid || isempty)) {
                phoneInput.addClass("invalid");
                window.setTimeout(() => phoneInput.removeClass("invalid"), 1000);
                return false;
            }

            $(this).html('Edit');
            var instructorData = [username, phoneInput.val()]
            $.ajax({
              url: "/updateInstructorPhone",
              data: JSON.stringify(instructorData),

              type: "POST",
              contentType: "application/json",
              success: function(response) {
                  msgFlash("Instructor's phone number updated", "success")
              },
              error: function(request, status, error) {
                msgFlash("Error updating phone number", "danger")
              }
            });
        }
    });
})
