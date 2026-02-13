document.addEventListener("DOMContentLoaded", function () {

    emailjs.init("ejP7Frotlqj7ARWao");

    const form = document.getElementById("bookingForm");
    const itemsContainer = document.getElementById("itemsContainer");
    const addItemBtn = document.getElementById("addItem");
    const totalPriceEl = document.getElementById("totalPrice");
    const itemsSummaryEl = document.getElementById("itemsSummary");

    // Update total and summary (used everywhere)
    function updateTotalAndSummary() {
        let total = 0;
        const summary = [];

        document.querySelectorAll(".item-row").forEach(row => {
            const select = row.querySelector(".itemSelect");
            const qtyInput = row.querySelector(".quantity");

            if (!select || !qtyInput) return;

            const price = parseInt(select.value) || 0;
            let qty = parseInt(qtyInput.value) || 0;

            // Force qty >= 1 for paid items
            if (price > 0 && qty < 1) {
                qty = 1;
                qtyInput.value = 1;
            }

            total += price * qty;

            if (qty > 0 && select.value !== "") {
                const label = select.options[select.selectedIndex].text.split(" – ")[0].trim();
                summary.push(`${qty} × ${label}`);
            }
        });

        // Update DOM
        totalPriceEl.textContent = total;
        if (itemsSummaryEl) {
            itemsSummaryEl.textContent = summary.length > 0 ? summary.join(" • ") : "";
        }
    }

    // Add new item row
    addItemBtn.addEventListener("click", function () {
        console.log("Add button clicked"); // debug

        const newRow = document.createElement("div");
        newRow.classList.add("item-row");

        newRow.innerHTML = `
            <select class="itemSelect" required>
                <option value="">Select Item</option>
                <option value="40">Small Bag – ₵40</option>
                <option value="50">Medium Bag – ₵50</option>
                <option value="60">Big Bag – ₵60</option>
                <option value="70">Fridge (any size) – ₵70</option>
                <option value="0">Buckets / Small items – Free</option>
            </select>
            <input type="number" class="quantity" min="1" value="1" required>
        `;

        itemsContainer.appendChild(newRow);
        console.log("New row added");

        updateTotalAndSummary();
    });

    // Live updates on any input/change inside itemsContainer
    itemsContainer.addEventListener("input", updateTotalAndSummary);
    itemsContainer.addEventListener("change", function (e) {
        if (e.target.classList.contains("itemSelect")) {
            const row = e.target.closest(".item-row");
            if (!row) return;

            const qtyInput = row.querySelector(".quantity");
            if (e.target.value === "0") {
                qtyInput.value = "1";
                qtyInput.disabled = true;
            } else {
                qtyInput.disabled = false;
            }

            updateTotalAndSummary();
        }
    });

    // Initial calculation
    updateTotalAndSummary();

    // ────────────────────────────────────────────────
    //   Form submission with double-click protection
    // ────────────────────────────────────────────────
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');

        // Prevent double submission
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending… <span style="margin-left:8px;">⏳</span>';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';

        const total = parseInt(totalPriceEl.textContent) || 0;
        const hasDescription = document.getElementById("description").value.trim();

        if (total === 0 && !hasDescription) {
            Swal.fire({
                title: "Hold on...",
                text: "Please add at least one item or write something in the notes.",
                icon: "warning",
                confirmButtonColor: "#8B0000"
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Booking Request';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            return;
        }

        let itemsSummary = "";
        document.querySelectorAll(".item-row").forEach(row => {
            const select = row.querySelector(".itemSelect");
            const qty = row.querySelector(".quantity");
            if (select?.value && qty?.value) {
                const itemText = select.options[select.selectedIndex].text;
                itemsSummary += `${itemText} × ${qty.value}\n`;
            }
        });

        const templateParams = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim() || "Not provided",
            hostel: document.getElementById("hostel").value.trim(),
            date: document.getElementById("date").value,
            time: document.getElementById("time").value,
            items: itemsSummary || "No items listed",
            description: document.getElementById("description").value.trim() || "None",
            total: total.toString(),
            currency: "₵",
            total_display: total > 0 ? `₵${total}` : "₵0"
        };

        emailjs.send("service_v4e6v6s", "template_amiu0v6", templateParams)
            .then(() => {
                Swal.fire({
                    title: "Booking Request Sent!",
                    text: "We'll confirm via WhatsApp or call shortly.",
                    icon: "success",
                    confirmButtonColor: "#8B0000"
                });

                form.reset();
                while (itemsContainer.children.length > 1) {
                    itemsContainer.removeChild(itemsContainer.lastChild);
                }
                updateTotalAndSummary();

                // Reset button after success
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Booking Request';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            })
            .catch((error) => {
                console.error("EmailJS error:", error);
                Swal.fire({
                    title: "Oops...",
                    text: "Something went wrong. Please try again or contact us on WhatsApp.",
                    icon: "error",
                    confirmButtonColor: "#8B0000"
                });

                // Reset button on error so user can retry
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Booking Request';
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            });
    });
});