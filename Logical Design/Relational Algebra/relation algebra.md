# Relational Algebra

1. We join the related tables to link patients with their clinical activities and staff, then filter for those handled by active staff, and finally list the names of the corresponding patients.


$$
\pi_{\text{ Name}}
\Big(
    (\sigma_{\text{ Status = active}}(Staff)
    \bowtie_{\text{ Staff.STAFF ID = Clinical Activity.STAFF ID}} Clinical Activity)
    \bowtie_{\text{ Clinical Activity.IID = Patient.IID}} Patient
\Big)
$$


<br>

2. We select all staff who are active and combine them with those linked to at least one prescription through clinical activities.

$$
\pi_{\text{ STAFF ID}}\big(\sigma_{\text{ Status=active}}(Staff)\big)
\;\cup\;
\pi_{\text{ STAFF ID}}\big(
    Clinical Activity \bowtie_{\text{ Clinical Activity.CAID = Prescription.CAID}} Prescription
\big)
$$


<br>

3. We select all hospitals located in Benguerir and combine them with those that have at least one department specializing in Cardiology.
$$
\pi_{\text{ HID}}\big(\sigma_{\text{ City}='Benguerir'}(Hospital)\big)
\;\cup\;
\pi_{\text{ HID}}\big(
    \sigma_{\text{ Specialty}='Cardiology'}(Department)
\big)
$$

<br>


4. We select $HID$ of Hospitals that have Cardiology Department and we do the same for Hospitals that have Pedialtric Department and we do interection of both sets.

$$
\pi_{\mathrm{HID}}
\Big(
  \sigma_{\mathrm{speciality} = \text{"Cardiology"}}(\mathrm{Department})
\Big)
\ \cap \
\pi_{\mathrm{HID}}
\Big(
  \sigma_{\mathrm{speciality} = \text{"Pediatrics"}}(\mathrm{Department})
\Big)
$$

<br>


5. The natural join give us a set of all staff members that work in any department of Hospital with $HID =1$ and then we divide Staff by thi set to get all staff members that work in every department.

$$
\mathrm{Staff} \div 
\Big(
  \sigma_{\mathrm{HID} = 1}(\mathrm{Department})
  \bowtie
  \text{work in}
\Big)
$$

<br>


6. Since Clinical Activity link staff and department we just select dept_id=2 and the result will divide staff 

$$
\mathrm{Staff} \div 
\Big(
  \sigma_{\text{dept id} = 2}(\text{Clinical Activity})
\Big)
$$

<br>
