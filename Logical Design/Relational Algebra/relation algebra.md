1. We join the related tables to link patients with their clinical activities and staff, then filter for those handled by active staff, and finally list the names of the corresponding patients.


$$
\pi_{\text{ Name}}
\Big(
    (\sigma_{\text{ Status} = 'active'}(Staff)
    \bowtie_{\text{ Staff.STAFF\_ID} = \text{Clinical\_Activity.STAFF\_ID}} Clinical\_Activity)
    \bowtie_{\text{ Clinical\_Activity.IID} = \text{Patient.IID}} Patient
\Big)
$$

<br>

2. We select all staff who are active and combine them with those linked to at least one prescription through clinical activities.

$$
\pi_{\text{ STAFF\_ID}}\big(\sigma_{\text{ Status}='active'}(Staff)\big)
\;\cup\;
\pi_{\text{ STAFF\_ID}}\big(
    Clinical\_Activity \bowtie_{\text{ Clinical\_Activity.CAID}=\text{Prescription.CAID}} Prescription
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