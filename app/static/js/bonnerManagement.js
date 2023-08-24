import searchUser from './searchUser.js'

// add or remove from the Bonner cohort for a particular year
function cohortRequest(year, method, username){
  $.ajax({
    url: `/bonner/${year}/${method}/${username}`,
    type: "POST",
    success: function(s){
        reloadWithAccordion("cohort-" + year)
    },
    error: function(error, status){
        console.log(error, status)
    }
  })
}

/*** Run After Page Load *************************************/
$(document).ready(function(){
    $("input[type=search]").on("input", function(){
        let year = $(this).data('year')
        searchUser(this.id, s => cohortRequest(year, "add", s.username), false, null, "student")
    });
    $(".removeBonner").on("click",function(){
        let year = $(this).data('year')
        cohortRequest(year, "remove", $(this).data("username"));
    });

    // Add requirements sorting
    // https://github.com/SortableJS/Sortable
    // https://sortablejs.github.io/Sortable/
    var requirementsObj = new Sortable($('#requirements tbody')[0], {
        animation: 150,
        forceFallback: false,
        handle: '.drag-handle',
        revertOnSpill: true,
        onUpdate: function() {
            enableSave();
        }
    });

    addRequirementsRowHandlers()

    // Add Requirement handler
    $("#reqAdd").click(function() {
        addRequirement();
        disableSave();
    });

    // Save Requirements handler
    $("#reqSave").click(function() {
        disableSave();
        saveRequirements()
    });
    /* I don't think there's really a bug in your solution. When you delete, it saves, but only if you hit the "Save Changes" button.
    The ajax request runs on the "Save changes" button, and its functionality is right above this comment.
    We should have the logic run when you hit the "Delete" button. I tried it, but couldn't get it to work. */

});
/** End onready ****************************/

/* Add a new requirements row and focus it */
function addRequirement() {
    var table = $("#requirements");
    var newRow = $(
        '<tr data-id="X">' +
        '  <td class="align-middle drag-handle"><img src="static/drag-handle.jpg" width="24" height="24" /></td>' +
        '  <td><input class="form-control" value=""></td>' +
        '  <td>' +
        '    <select class="form-select required-select">' +
        '      <option selected>Required</option>' +
        '      <option>Optional</option>' +
        '    </select>' +
        '  </td>' +
        '  <td>' +
        '    <select class="flex-column form-select empty frequency-select" name="frequency_X">' +
        '      <option selected>Frequency</option>' +
        '      <option value="once">Once</option>' +
        '      <option value="annual">Annual</option>' +
        '      <option value="term">Every Term</option>' +
        '    </select>' +
        '  </td>' +
        '  <td><button type="button" class="btn btn-danger">Remove</button></td>' +
        '</tr>'
      );
    table.append(newRow)
    addRequirementsRowHandlers()
    newRow.find("input").focus()
}

/* Get the data for the whole requirement set and save them */
function saveRequirements() {
    var data = $("#requirements tbody tr").map((i,row) => (
                    {
                        'id': $(row).data("id"),
                        'name': $(row).find("input").val(),
                        'required': $(row).find("select.required-select").val() == 'Required' ? true : false,
                        'frequency': $(row).find("select.frequency-select").val()
                    }
                )).get()

    $.ajax({
        method: 'POST',
        url: '/saveRequirements/1', // Bonner certification id hard-coded here
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(ids) {
            // update our rows with any new ids
            let rows = $('#requirements tbody tr').get()
            ids.forEach(function(id, index) {
                let row = $(rows[index])
                if(id != row.data('id')) {
                    row.data('id', id);
                }
            });
            msgToast("Bonner", "Updated Bonner Requirements");
        },
        error: function(e) {
            msgToast("Error", "Error Saving Requirements");
        }
    });
}

function enableSave() {
    $("#reqSave").attr("disabled", false);
}
function disableSave() {
    $("#reqSave").attr("disabled", true);
}

function addRequirementsRowHandlers() {
    /* Add all of the event handlers to elements in the requirements row.
     *
     * Enable the Save button when there are changes and row additions or removals.
     * Validate the name entry so that they can't submit empty values.
     * Make the frequency select have a selectable default value
     */

    // frequency select styling
    $(".frequency-select").change(function () {
        if(!$(this).val()) {
            $(this).addClass("empty");
        } else {
            $(this).removeClass("empty");
        }
    });
    $(".frequency-select").change();
    // add this one after we trigger the first change event
    $(".frequency-select").change(function(e) {
        enableSave();
    });

    // detect changes so we can enable saving
    $(".required-select").change(function(e) {
        enableSave();
    });

    // handle invalid and valid entries
    $("#requirements input").keyup(function(e) {
        if($(this).val() == "") {
            $(this).addClass('invalid');
            disableSave();
        } else {
            $(this).removeClass('invalid');
            enableSave();
        }
    });
    $("#requirements input").focusout(function(e) {
        if($(this).val() == "") {
            $(this).addClass('invalid');
            $(this).focus()
        }
    });

    // enable the remove button
    $("#requirements button").click(function(e) {
        enableSave();
        $(e.target.closest('tr')).fadeOut(function() { this.remove() });
    });
}