function CheckInPopup({

  onConfirm,

  strictMode

}) {

  return (

    <div className="popup">

      <h2>

        Did you complete
        the session?

      </h2>

      <button
        onClick={onConfirm}
      >

        Yes

      </button>

      {

        !strictMode && (

          <button>

            Snooze

          </button>

        )

      }

    </div>

  );

}

export default CheckInPopup;


/*ACTIVE
↓ timer expires
CHECK_IN_PENDING
↓ socket event
frontend popup*/