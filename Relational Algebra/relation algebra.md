1. We start by joining the three tables through their common keys, then we filter the result to keep only the activities handled by active staff. Finally, we project the names of the patients who meet this condition.


$$
\pi_{\text{ Name}}
\Big(
    (\sigma_{\text{ Status} = 'active'}(Staff)
    \bowtie_{\text{ Staff.STAFF\_ID} = \text{Clinical\_Activity.STAFF\_ID}} Clinical\_Activity)
    \bowtie_{\text{ Clinical\_Activity.IID} = \text{Patient.IID}} Patient
\Big)
$$

2. We select all staff who are active and combine them with those linked to at least one prescription through clinical activities.

$$
\pi_{\text{ STAFF\_ID}}\big(\sigma_{\text{ Status}='active'}(Staff)\big)
\;\cup\;
\pi_{\text{ STAFF\_ID}}\big(
    Clinical\_Activity \bowtie_{\text{Clinical\_Activity.CAID}=\text{Prescription.CAID}} Prescription
\big)
$$
