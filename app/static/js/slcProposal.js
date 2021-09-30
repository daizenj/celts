import searchUser from './searchUser.js'

function callback() {
  let instructor = $("#courseInstructor").val();
  let tableBody = $("#instructorTable").find("tbody");
  let lastRow = tableBody.find("tr:last");
  let newRow = lastRow.clone();
  newRow.find("td:eq(0)").text(instructor);
  newRow.prop("hidden", false);
  lastRow.after(newRow);
}

$("#courseInstructor").on('input', function() {
  searchUser("courseInstructor", "searchInstructor");
  callback();
});

$("#instructorTable").on("click", "#remove", function() {
   $(this).closest("tr").remove();
});

$(document).ready ( function() {
  var cookies = document.cookie;
  console.log("is there cookie?", document.cookie);
  if (cookies){
    console.log("cookie");
    parsedCookies = JSON.parse(cookies);
    document.cookie = parsedCookies + ";max-age=28800;";
    console.log("par", parsedCookies.sectionsResponse);

    $("#courseName").val(parsedCookies.courseName);
    $("#courseAbbreviation").val(parsedCookies.courseAbbreviation);
    $("#credit").val(parsedCookies.credit);
    $("#slSectionsToggle").val(parsedCookies.sectionsResponse);
    $("#inputCourseInstructor").val(parsedCookies.inputCourseInstructor);
    $("#slDesignation").val(parsedCookies.slDesignation);
  }

});

function saveSLCdata(){
  var courseName = $('#courseName').val();
  var courseAbbreviation = $('#courseAbbreviation').val()
  var credit = $("#credit").val()
  var slSectionsToggle = $("#slSectionsToggle").val()
  var inputCourseInstructor = $("#inputCourseInstructor").find("option:selected").val();
  var slDesignation = $("#slDesignation").text()

  var proposalData = {
    courseName: courseName,
    courseAbbreviation: courseAbbreviation,
    credit: credit,
    slSectionsToggle: slSectionsToggle,
    inputCourseInstructor: inputCourseInstructor,
    slDesignation: slDesignation
  }
  console.log(proposalData, "data");

  document.cookie =  JSON.stringify(proposalData) + ";max-age=28800;";
}
