from flask import request, render_template, abort, flash
from flask import Flask, redirect, url_for, g
from app.models.event import Event
from app.logic.trackAttendees import trainedParticipants
from app.models.programEvent import ProgramEvent
import json
from datetime import *
from app.controllers.admin import admin_bp
from app.models.eventParticipant import EventParticipant
from app.models.program import Program
from app.logic.updateTrackHours import updateTrackHours, getEventLengthInHours, addVolunteerToEvent
from app.controllers.admin.searchDeleteTrackHoursVolunteer import searchTrackHoursVolunteers
from peewee import DoesNotExist


@admin_bp.route('/testing', methods=['GET'])
def testing():
    return "<h1>Hello</h1>"

@admin_bp.route('/<programID>/<eventID>/track_hours', methods=['GET'])
def trackVolunteerHoursPage(programID, eventID):

    trainingEvents = ProgramEvent.select().where(ProgramEvent.program == programID)
    trlist = [training.event for training in trainingEvents if training.event.isTraining]
    attendedTraining = trainedParticipants(programID, trlist)

    if g.current_user.isCeltsAdmin:
        if ProgramEvent.get_or_none(ProgramEvent.event == eventID, ProgramEvent.program == programID):
            eventParticipantsData = EventParticipant.select().where(EventParticipant.event == eventID)

            eventParticipantsData = eventParticipantsData.objects()

            event = Event.get_by_id(eventID)
            program = Program.get_by_id(programID)
            startTime = event.timeStart
            endTime = event.timeEnd
            eventDate = event.startDate #start date and end date will be the same

            eventLengthInHours = getEventLengthInHours(startTime, endTime, eventDate)


            return render_template("/events/trackVolunteerHours.html",
                                    eventParticipantsData = list(eventParticipantsData),
                                    eventLength = eventLengthInHours,
                                    program = program,
                                    event = event,
                                    attendedTraining=attendedTraining,
                                    trlist = trlist )
        else:
            raise Exception("Event ID and Program ID mismatched")

    else:
        abort(403)

@admin_bp.route('/<programID>/<eventID>/track_hours', methods=['POST'])
def updateHours(programID, eventID):
    updateTrackHoursMsg = updateTrackHours(request.form)
    flash(updateTrackHoursMsg)
    return redirect(url_for("admin.trackVolunteerHoursPage", programID=programID, eventID=eventID))

@admin_bp.route('/addVolunteerToEvent/<user>/<volunteerEventID>/<eventLengthInHours>', methods = ['POST'])
def addVolunteerToTrackHours(user, volunteerEventID, eventLengthInHours):
    trackHoursUpdate = addVolunteerToEvent(user, volunteerEventID, eventLengthInHours)
    flash(trackHoursUpdate)
    return trackHoursUpdate
