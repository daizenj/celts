$(document).ready(function(){

  $("#phoneInput").inputmask('(999)-999-9999');
  $(".form-check-input").click(function updateInterest(){
    var programID = $(this).data("programid");
    var username = $(this).data('username');

    var interest = $(this).is(':checked');
    var routeUrl = interest ? "addInterest" : "removeInterest";
    interestUrl = "/" + username + "/" + routeUrl + "/" + programID ;

    $.ajax({
      method: "POST",
      url: interestUrl,
      success: function(response) {
          reloadWithAccordion("programTable")  //  Reloading page after user clicks on the show interest checkbox
      },
      error: function(request, status, error) {
        console.log(status,error);
        location.reload();
      }
    });
  });
  // This function is to disable all the dates before current date in the ban modal End Date picker
  $(function(){
    var banEndDatepicker = $("#banEndDatepicker");
    banEndDatepicker.datepicker({
      changeYear: true,
      changeMonth: true,
      minDate:+1,
      dateFormat: "yy-mm-dd",
    }).attr('readonly','readonly');
  });

  $(".ban").click(function() {
    var banButton = $("#banButton")
    var banEndDateDiv = $("#banEndDate") // Div containing the datepicker in the ban modal
    var banEndDatepicker = $("#banEndDatepicker") // Datepicker in the ban modal
    var banNoteDiv = $("#banNoteDiv") // Div containing the note displaying why the user was banned previously
                                     //Should only diplay when the modal is going to unban a user
    var banNote = $("#banNote")

    banButton.text($(this).val() + " Volunteer");
    banButton.data("programID", $(this).data("programid"))
    banButton.data("username", $(".form-check-input").data("username"))
    banButton.data("banOrUnban", $(this).val());
    banEndDateDiv.show();
    banEndDatepicker.val("")
    $(".modal-title").text($(this).val() + " Volunteer");
    $("#modalProgramName").text("Program: " + $(this).data("name"));
    $("#banModal").modal("toggle");
    banNoteDiv.hide();
    $("#banNoteTxtArea").val("");
    $("#banButton").prop("disabled", true);
    if( $(this).val()=="Unban"){
      banEndDateDiv.hide()
      banEndDatepicker.val("0001-01-01") //This is a placeholder value for the if statement in line 52 to work properly #PLCHLD1
      banNoteDiv.show()
      banNote.text($(this).data("note"))
    }

  });

  $("#banNoteTxtArea, #banEndDatepicker").on('input' , function (e) { //This is the if statement the placeholder in line 45 is for #PLCHLD1
    var enableButton = ($("#banNoteTxtArea").val() && $("#banEndDatepicker").val());
    $("#banButton").prop("disabled", !enableButton);
  });

  $("#banButton").click(function (){
     $("#banButton").prop("disabled", true)
    var username = $(this).data("username") //Expected to be the unique username of a user in the database
    var route = ($(this).data("banOrUnban")).toLowerCase() //Expected to be "ban" or "unban"
    var program = $(this).data("programID") //Expected to be a program's primary ID
    $.ajax({
      method: "POST",
      url:  "/" + username + "/" + route + "/" + program,
      data: {"note": $("#banNoteTxtArea").val(),
             "endDate":$("#banEndDatepicker").val() //Expected to be a date in this format YYYY-MM-DD
            },
      success: function(response) {
        location.reload();
      }
    });
  });

  $(".savebtn").click(function () { // Updates the Background check of a volunteer in the database
    $(this).prop("disabled", true);
    let bgCheckType = $(this).data("id")
    let bgDate = $("#" + bgCheckType + "_date").val()
    let bgStatus = $("#" + bgCheckType).val()

    if (bgStatus == '' && bgDate != '') {
        displayMessage("Status<br>Empty!", "danger")
        return
    }

    if (bgStatus == '' && bgDate == '' ) {
      displayMessage("Both Fields<br>Empty!", "danger")
      return
    }

    if (bgStatus != '' && bgDate == '' ) {
        displayMessage("Date<br>Empty!", "danger")
        return
    }

    let data = {
        bgStatus: bgStatus,      // Expected to be one of the three background check statuses
        user: $(this).data("username"),   // Expected to be the username of a volunteer in the database
        bgType: $(this).attr("id"),       // Expected to be the ID of a background check in the database
        bgDate: bgDate  // Expected to be the date of the background check completion or '' if field is empty
    }
    $.ajax({
      url: "/addBackgroundCheck",
      type: "POST",
      data: data,
      success: function(s){
        displayMessage("Saved!", "success")
        var date = new Date(data.bgDate + " 12:00").toLocaleDateString()
        $("#bgHistory" + data.bgType).prepend(`<li> ${data.bgStatus}: ${date} </li>`);
        reloadWithAccordion("background")
      },
      error: function(error, status){
          console.log(error, status)
      }
    })
  });

  $("#bgHistoryTable").on("click", "#deleteBgHistory", function() {
    let data = {
        bgID: $(this).data("id"),       // Expected to be the ID of a background check in the database
    }
    $(this).closest("li").remove();

    $.ajax({
      url: "/deleteBackgroundCheck",
      type: "POST",
      data: data,
      success: function(s){
        reloadWithAccordion("background")
      },
      error: function(error, status){
        console.log(error,status)
      }
    })
  });
  // Popover functionalitie
    var requiredTraining = $(".trainingPopover");
    requiredTraining.popover({
       trigger: "hover",
       sanitize: false,
       html: true,
       content: function() {
            return $(this).attr('data-content');
        }
    });

  $("#updatePhone").on('click', function() {
    var username = $(this).data("username")
    validatePhoneNumber(this, "#phoneInput", username)
  });
});

function displayMessage(message, color) {  // displays message for saving background check
    $("#displaySave").html(message).addClass("text-"+ color)
    setTimeout(function() {$("#displaySave").html("").removeClass("text-"+ color)}, 2000)
}

$(function() {

     toastElementList = [].slice.call(document.querySelectorAll('.toast'))
     toastList = toastElementList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl)
    })



});


function updateManagers(el, volunteer_username ){// retrieve the data of the student staff and program id if the boxes are checked or not
  let program_id=$(el).attr('data-programid');
  let programName = $(el).attr('data-programName')
  let name = $(el).attr('data-name')
  let action= el.checked ? 'add' : 'remove';
  let removeMessage = (name + " is no longer the manager of " + programName + ".")
  let addMessage =  (name + " is now the manager of " + programName + ".")
  let notification = $("#liveToast").clone()

  $.ajax({
    method:"POST",
    url:"/updateProgramManager",
    data : {"user_name":volunteer_username, //student staff: user_name
            "program_id":program_id,       // program id
            "action":action,          //action: add or remove
             },

     success: function(s){
         if ($("#liveToast").is(":visible") == true){
             toastList[0].hide()
             $("#toastDiv").empty()
             notification.appendTo("#toastDiv")
             programManagerToastElements = [].slice.call(document.querySelectorAll('.toast'))
             programManagerToastList = programManagerToastElements.map(function (toastEl) {
                 return new bootstrap.Toast(toastEl)
             })
         }

         if(action == "add"){
             $("#toast-body").html(addMessage)
         }
         else if(action == 'remove'){
             $("#toast-body").html(removeMessage)
         }
         toastList[0].show()
      },
      error: function(error, status){
          console.log(error, status)
      }
  })
}
