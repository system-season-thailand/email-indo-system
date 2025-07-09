// DOM elements
const hotelList = document.getElementById('hotelList');
const hotelSearch = document.getElementById('hotelSearch');
const bookingForm = document.getElementById('bookingForm');
const toEmail = document.getElementById('toEmail');
const ccEmail = document.getElementById('ccEmail');
const guestName = document.getElementById('guestName');
const occasion = document.getElementById('occasion');
const hotelName = document.getElementById('hotelName');
const totalRooms = document.getElementById('totalRooms');
const roomType = document.getElementById('roomType');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const nightsBooked = document.getElementById('nightsBooked');
const specialRequests = document.getElementById('specialRequests');
const csendEmailBtn = document.getElementById('sendEmail');
const senderName = document.getElementById('senderName');

// Initialize Select2 for all dropdown elements
let occasionSelect2, totalRoomsSelect2, roomTypeSelect2, senderNameSelect2;
let checkInPicker, checkOutPicker;
$(document).ready(function () {
    // Initialize Select2 for Occasion
    occasionSelect2 = $('#occasion').select2({
        minimumResultsForSearch: Infinity,
        width: '100%'
    });

    // Initialize Select2 for Total Rooms
    totalRoomsSelect2 = $('#totalRooms').select2({
        minimumResultsForSearch: Infinity,
        width: '100%'
    });

    // Initialize Select2 for Room Type
    roomTypeSelect2 = $('#roomType').select2({
        minimumResultsForSearch: Infinity,
        width: '100%'
    });

    // Initialize Select2 for Sender Name
    senderNameSelect2 = $('#senderName').select2({
        minimumResultsForSearch: Infinity,
        width: '100%'
    });

    // Restore senderName from localStorage if present
    const savedSenderName = localStorage.getItem('senderName');
    if (savedSenderName) {
        $('#senderName').val(savedSenderName).trigger('change');
    }
    // Save senderName to localStorage on change
    $('#senderName').on('change', function () {
        localStorage.setItem('senderName', this.value);
    });

    // Initialize flatpickr for Check In Date
    checkInPicker = flatpickr('#checkInDate', {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd M Y',
        allowInput: true,
        minDate: 'today',
        onOpen: function (selectedDates, dateStr, instance) {
            highlightInput('#checkInDate');
            moveIndicatorToFlatpickrCalendar(document.getElementById('checkInDate'));
        },
        onChange: function (selectedDates, dateStr, instance) {
            // Update minDate for Check Out Date to be one day after selected Check In Date
            if (selectedDates && selectedDates[0]) {
                if (checkOutPicker) {
                    const nextDay = new Date(selectedDates[0]);
                    nextDay.setDate(nextDay.getDate() + 1);
                    checkOutPicker.set('minDate', nextDay);
                    // If current checkOutDate is before new minDate, clear it
                    if (checkOutDate.value && new Date(checkOutDate.value) < nextDay) {
                        checkOutPicker.clear();
                    }
                    checkOutPicker.jumpToDate(selectedDates[0]);
                }
            }
            setTimeout(() => {
                if (checkOutPicker) {
                    highlightInput('#checkOutDate');
                    checkOutPicker.open();
                    moveIndicatorToFlatpickrCalendar(document.getElementById('checkOutDate'));
                    checkOutDate.focus();
                }
            }, 100);
        }
    });

    // Initialize flatpickr for Check Out Date
    checkOutPicker = flatpickr('#checkOutDate', {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd M Y',
        allowInput: true,
        minDate: 'today',
        onOpen: function (selectedDates, dateStr, instance) {
            highlightInput('#checkOutDate');
            moveIndicatorToFlatpickrCalendar(document.getElementById('checkOutDate'));
        },
        onChange: function (selectedDates, dateStr, instance) {
            setTimeout(() => {
                guestName.focus();
                highlightInput('#guestName');
                moveIndicatorToElement(document.getElementById('guestName'));
            }, 100);
        }
    });
});

// Initialize the app
function init() {
    renderHotelList(hotels);
    setupEventListeners();

    // Set default dates
    const today = new Date();
    checkInDate.valueAsDate = today;
    calculateNights();
}

// Render hotel list
function renderHotelList(hotelsToRender) {
    hotelList.innerHTML = '';

    hotelsToRender.slice(0, 15).forEach(hotel => {
        const hotelItem = document.createElement('div');
        hotelItem.className = 'hotel-item';
        hotelItem.textContent = hotel.name;
        hotelItem.dataset.id = hotel.id;
        hotelList.appendChild(hotelItem);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Hotel search
    hotelSearch.addEventListener('input', () => {
        const searchTerm = hotelSearch.value.toLowerCase();
        const filteredHotels = hotels.filter(hotel =>
            hotel.name.toLowerCase().includes(searchTerm)
        );
        renderHotelList(filteredHotels);
    });

    // Hotel selection
    hotelList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hotel-item')) {
            // Remove active class from all items
            document.querySelectorAll('.hotel-item').forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to selected item
            e.target.classList.add('active');

            // Get hotel data
            const hotelId = parseInt(e.target.dataset.id);
            const selectedHotel = hotels.find(hotel => hotel.id === hotelId);

            // Populate form with hotel data
            toEmail.value = selectedHotel.toEmail;
            ccEmail.value = selectedHotel.ccEmail;
            hotelName.value = selectedHotel.name;

            // Populate room types
            // roomType.innerHTML = '<option value="">Select room type</option>';
            roomType.innerHTML = '';
            selectedHotel.roomTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                roomType.appendChild(option);
            });
            // Destroy previous Select2 instance if it exists
            if ($(roomType).hasClass('select2-hidden-accessible')) {
                $(roomType).select2('destroy');
            }
            // Re-initialize Select2
            roomTypeSelect2 = $('#roomType').select2({
                minimumResultsForSearch: Infinity,
                width: '100%'
            });
            // Re-attach guided workflow for Room Type -> Check In Date
            $('#roomType').off('select2:open.guided').on('select2:open.guided', function () {
                highlightSelect2('#roomType');
                moveIndicatorToElement($('#roomType').next('.select2-container')[0]);
                setTimeout(() => {
                    $('.select2-results__option').off('mouseup.custom').on('mouseup.custom', function () {
                        setTimeout(() => {
                            highlightInput('#checkInDate');
                            moveIndicatorToElement(document.getElementById('checkInDate'));
                            checkInDate.focus();
                            if (checkInDate._flatpickr) {
                                checkInDate._flatpickr.open();
                                moveIndicatorToFlatpickrCalendar(document.getElementById('checkInDate'));
                            }
                        }, 100);
                    });
                }, 0);
            });

            // Set special requests
            specialRequests.value = selectedHotel.specialRequests;

            // Guided focus: Open Occasion dropdown
            setTimeout(() => {
                $('#occasion').select2('open');
                occasion.focus();
            }, 100);
        }
    });

    // Helper to open next dropdown even if the same value is clicked
    function openNextDropdown(currentId, nextId, nextFocus) {
        $(currentId).on('select2:open', function () {
            setTimeout(() => {
                $('.select2-results__option').off('mouseup.custom').on('mouseup.custom', function () {
                    setTimeout(() => {
                        $(nextId).select2('open');
                        if (nextFocus) nextFocus.focus();
                    }, 100);
                });
            }, 0);
        });
    }

    // Occasion -> Total Rooms
    openNextDropdown('#occasion', '#totalRooms', totalRooms);
    $('#occasion').on('select2:open', function () {
        highlightSelect2('#occasion');
        moveIndicatorToElement($('#occasion').next('.select2-container')[0]);
    });
    // Total Rooms -> Room Type
    openNextDropdown('#totalRooms', '#roomType', roomType);
    $('#totalRooms').on('select2:open', function () {
        highlightSelect2('#totalRooms');
        moveIndicatorToElement($('#totalRooms').next('.select2-container')[0]);
    });
    // Room Type -> Check In Date
    $('#roomType').off('select2:open.guided').on('select2:open.guided', function () {
        highlightSelect2('#roomType');
        moveIndicatorToElement($('#roomType').next('.select2-container')[0]);
        setTimeout(() => {
            $('.select2-results__option').off('mouseup.custom').on('mouseup.custom', function () {
                setTimeout(() => {
                    highlightInput('#checkInDate');
                    moveIndicatorToElement(document.getElementById('checkInDate'));
                    checkInDate.focus();
                    if (checkInDate._flatpickr) checkInDate._flatpickr.open();
                }, 100);
            });
        }, 0);
    });

    // When Check In Date opens
    if (checkInPicker) {
        checkInPicker.config.onOpen.push(function () {
            highlightInput('#checkInDate');
            moveIndicatorToElement(document.getElementById('checkInDate'));
        });
    }
    // When Check Out Date opens
    if (checkOutPicker) {
        checkOutPicker.config.onOpen.push(function () {
            highlightInput('#checkOutDate');
            moveIndicatorToElement(document.getElementById('checkOutDate'));
        });
    }

    // Date calculations
    checkInDate.addEventListener('change', calculateNights);
    checkOutDate.addEventListener('change', calculateNights);

    // Copy email
    csendEmailBtn.addEventListener('click', function () { generateEmail(true); sendEmail(); });
}

// Calculate number of nights
function calculateNights() {
    if (checkInDate.value && checkOutDate.value) {
        const checkIn = new Date(checkInDate.value);
        const checkOut = new Date(checkOutDate.value);

        // Ensure check-out is after check-in
        if (checkOut <= checkIn) {
            alert('Check-out date must be after check-in date');
            checkOutDate.value = '';
            nightsBooked.value = '';
            return;
        }

        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsBooked.value = diffDays + (diffDays === 1 ? ' Night' : ' Nights');
    }
}

// Generate email
function generateEmail(showAlert = false) {
    if (!bookingForm.checkValidity()) {
        if (showAlert) {
            alert('Please fill in all required fields');
        }
        return;
    }

    // Format dates
    const checkIn = new Date(checkInDate.value);
    const checkOut = new Date(checkOutDate.value);

    const formattedCheckIn = checkIn.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedCheckOut = checkOut.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    // Generate subject
    const subject = `New Booking ${hotelName.value} ${formatDateForSubject(checkInDate.value)} - ${formatDateForSubject(checkOutDate.value)} For ${guestName.value}`;

    // Generate email body
    const emailContent = `Dear Reservation clerk,\n\nWarmest Greetings From Fanadiq Indonesia Jaya…!\nPlease find below the reservation details for our upcoming guest :\n\nGuest Origin\tMiddle East\nGuest Name\t${guestName.value}\nOccasion\t${occasion.value}\nHotel Name\t${hotelName.value}\nTotal Room\t${totalRooms.value} Unit${totalRooms.value > 1 ? 's' : ''}\nRoom Type\t${roomType.value}\nNo of Nights Booked\t${nightsBooked.value}\nMeal Plan\tBed & Breakfast\nCheck In Date\t${formattedCheckIn}\nCheck Out Date\t${formattedCheckOut}\nSpecial Request\t${specialRequests.value}\n\nKindly need your assistance to check your room availability based on the above arrangement and please send your confirmation letter and proforma invoice as well.\n\nThank you and look forward to hearing from you soon.\n\n\nRegards,\n\n\n${senderName.value}\nReservation\n\nPT Fanadiq Indonesia Jaya\nJl Raya Puncak KM 83,7 Tugu Selatan, Cisarua Bogor | Jawa Barat | Indonesia\nP : +62 251 8262973\nEmail : reservation.fanadiq@fanadiqindonesia.com\nwww.fanadiqindonesia.com`;

    // Prepare the template parameters to match EmailJS template
    const templateParams = {
        toEmails: toEmail.value,           // For {{toEmails}}
        ccEmails: ccEmail.value,           // For {{ccEmails}}
        replyEmails: toEmail.value,        // For {{replyEmails}}, or use another field if needed
        guestName: guestName.value,
        occasion: occasion.value,
        hotelName: hotelName.value,
        totalRoom: `${totalRooms.value} Unit${totalRooms.value > 1 ? 's' : ''}`,
        roomType: roomType.value,
        totalNights: nightsBooked.value,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        specialRequest: specialRequests.value,
        teamName: senderName.value,
        date: `${formatDateForSubject(checkInDate.value)} - ${formatDateForSubject(checkOutDate.value)}`
    };

    emailjs.send('service_gmail_richegoo', 'template_70nfadg', templateParams)
        .then(function (response) {
            alert('Email sent successfully!');
        }, function (error) {
            alert('Failed to send email: ' + JSON.stringify(error));
        });
}

// Format date for subject (e.g., 20-24 June)
function formatDateForSubject(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}`;
}

// Add this new function:
function sendEmail() {
    if (!bookingForm.checkValidity()) {
        alert('Please generate the email first');
        return;
    }

    const SERVICE_ID = 'service_gmail_richegoo';
    const TEMPLATE_ID = 'template_70nfadg';

    // Format dates for the subject
    const checkIn = new Date(checkInDate.value);
    const checkOut = new Date(checkOutDate.value);
    const formattedCheckIn = checkIn.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedCheckOut = checkOut.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateRange = `${formatDateForSubject(checkInDate.value)} - ${formatDateForSubject(checkOutDate.value)}`;

    // Prepare the template parameters to match EmailJS template
    const templateParams = {
        toEmails: toEmail.value,           // For {{toEmails}}
        ccEmails: ccEmail.value,           // For {{ccEmails}}
        replyEmails: toEmail.value,        // For {{replyEmails}}, or use another field if needed
        guestName: guestName.value,
        occasion: occasion.value,
        hotelName: hotelName.value,
        totalRoom: `${totalRooms.value} Unit${totalRooms.value > 1 ? 's' : ''}`,
        roomType: roomType.value,
        totalNights: nightsBooked.value,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        specialRequest: specialRequests.value,
        teamName: senderName.value,
        date: dateRange
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(function (response) {
            alert('Email sent successfully!');
        }, function (error) {
            alert('Failed to send email: ' + JSON.stringify(error));
        });
}

// Highlight helpers
function highlightSelect2(id) {
    $('.select2-selection--single').removeClass('active-focus');
    $(id).next('.select2-container').find('.select2-selection--single').addClass('active-focus');
    $('.active-focus').not($(id).next('.select2-container').find('.select2-selection--single')).removeClass('active-focus');
}
function highlightInput(input) {
    $('.select2-selection--single').removeClass('active-focus');
    $('.active-focus').removeClass('active-focus');
    $(input).addClass('active-focus');
}

// Floating indicator helper
function moveIndicatorToElement(element) {
    const indicator = document.getElementById('focus-indicator');
    if (!indicator || !element) return;
    const rect = element.getBoundingClientRect();
    // Position the dot to the left of the element, vertically centered
    indicator.style.top = `${window.scrollY + rect.top + rect.height / 2 - 12}px`;
    indicator.style.left = `${window.scrollX + rect.left - 36}px`;
    indicator.style.display = 'block';
}

function moveIndicatorToFlatpickrCalendar(input) {
    const indicator = document.getElementById('focus-indicator');
    const calendar = input._flatpickr && input._flatpickr.calendarContainer;
    if (!indicator || !calendar) return;
    const rect = calendar.getBoundingClientRect();
    indicator.style.top = `${window.scrollY + rect.top + rect.height / 2 - 12}px`;
    indicator.style.left = `${window.scrollX + rect.left - 36}px`;
    indicator.style.display = 'block';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Move indicator to Guest Name and Special Requests on focus
if (guestName) {
    guestName.addEventListener('focus', function () {
        moveIndicatorToElement(guestName);
    });
}
if (specialRequests) {
    specialRequests.addEventListener('focus', function () {
        moveIndicatorToElement(specialRequests);
    });
}
if (checkInDate) {
    checkInDate.addEventListener('focus', function () {
        moveIndicatorToElement(checkInDate);
    });
}
if (checkOutDate) {
    checkOutDate.addEventListener('focus', function () {
        moveIndicatorToElement(checkOutDate);
    });
}