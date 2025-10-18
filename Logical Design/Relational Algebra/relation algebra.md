# Relational Algebra

### 1. We join the related tables to link patients with their clinical activities and staff, then filter for those handled by active staff, and finally list the names of the corresponding patients.


$$
\pi_{\text{ Name}}
\Big(
    (\sigma_{\text{ Status = active}}(Staff)
    \bowtie_{\text{ STAFF\\_ID}} Clinical Activity)
    \bowtie_{\text{ IID}} Patient
\Big)
$$


<br>

### 2. We select all staff who are active and combine them with those linked to at least one prescription through clinical activities.

$$
\pi_{\text{ STAFF ID}}\big(\sigma_{\text{ Status=active}}(Staff)\big)
\;\cup\;
\pi_{\text{ STAFF\\_ID}}\big(
    Clinical Activity \bowtie_{\text{ CAID}} Prescription
\big)
$$


<br>

### 3. We select all hospitals located in Benguerir and combine them with those that have at least one department specializing in Cardiology.

$$
\pi_{\text{HID}}
\big(
    \sigma_{\text{City} = 'Benguerir'}(\text{Hospital})
\big)
\;\cup\;
\pi_{\text{HID}}
\big(
    \sigma_{\text{Specialty} = 'Cardiology'}(\text{Department})
\big)
$$


<br>


### 4. We select $HID$ of Hospitals that have Cardiology Department and we do the same for Hospitals that have Pedialtric Department and we do interection of both sets.

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


### 5. The natural join give us a set of all staff members that work in any department of Hospital with $HID =1$ and then we divide Staff by thi set to get all staff members that work in every department.

$$
\mathrm{Staff} \div 
\Big(
  \sigma_{\mathrm{HID} = 1}(\mathrm{Department})
  \bowtie
  \text{work in}
\Big)
$$

<br>


### 6. Since Clinical Activity link staff and department we just select dept_id=2 and the result will divide staff 

$$
\mathrm{Staff} \div 
\Big(
  \sigma_{\text{dept id} = 2}(\text{Clinical Activity})
\Big)
$$

### 10.Find Staff IDs of staff who have issued more than one prescription.

```math
\begin{alignedat}{2}
& \rho(A, \; ClinicalActivity \; \bowtie_{ClinicalActivity.CAID=Prescription.CAID} \; Prescription)
& \quad\\[6pt]
& \rho(B, \; Staff \; \bowtie_{Staff.SID=A.SID} \; A)
& \quad\\[6pt]
& \rho(C, \; \text{ GROUP BY }; Staff\_ID\; \text{COMPUTE}\; \text{count}(PID)\rightarrow count1\;(B)) 
& \quad\\[6pt]
& \rho(D, \;\sigma_{count1>1}; C) 
& \quad\\[6pt]
& \pi_{Staff\_ID}(D)
\end{alignedat}
```

### 11. List IIDs of patients who have scheduled appointments in more than one department.

```math
\begin{alignedat}{2}
& \rho(A, \; ClinicalActivity \; \bowtie_{ClinicalActivity.CAID=Appointment.CAID} \; \sigma_{\text{Status}=\text{"Scheduled"}}(Appointment))
& \quad\\[6pt]
& \rho(B, \; \text{ GROUP BY }; IID\;\text{COMPUTE}\; \text{count}(DEP\_ID)\rightarrow count1\;(A)
& \quad\\[6pt]
& \rho(C, \;\sigma_{count1>1}(C))
& \quad\\[6pt]
& \pi_{IID}(C)
\end{alignedat}
```
### 12. Find Staff IDs who have no scheduled appointments on the day of the Green March holiday (November 6).


### 13. Find departments whose average number of clinical activities is below the global departmental average.

```math
\begin{alignedat}{2}
& \rho(H, \; \pi_{DEP\_ID,\; CAID} (\rho(4\rightarrow depid2,\; ClinicalActivity \; \bowtie \; Department))) \\
& \quad\\[6pt]
& \rho(M(2 \rightarrow cnt),\;  \pi_{DEP\_ID,\; count(CAID)}(\; GROUP\; BY\; DEP\_ID \;(H)\;)\big) \\
& \quad\\[6pt]
& \rho(AVG(1 \rightarrow avg),\; \pi_{AVG(cnt)}(M)) \\
& \quad\\[6pt]
& \rho(DEPS,\; \pi_{DEP\_ID}\big(\sigma_{M.cnt < AVG.avg}(M \times AVG)\big)) \\
& \quad\\[6pt]
& \pi_{DEP\_ID,\; Name,\; Specialty}(DEPS \; \bowtie \; Department)
\end{alignedat}
```



### 14. For each staff member, return the patient who has the greatest number of completed appointments with that staff member.

```math
\begin{alignedat}{2}
& \rho(A, (\sigma_{status='Completed'} (ClinicalActivity \; \bowtie \; Appointment))) \\
\\[6pt]
& \rho(B(3 \rightarrow cnt), (\pi_{STAFF\_ID,\; IID,\; COUNT(*)} (GROUP\; BY\; STAFF\_ID,\; IID\; (A)))) \\
\\[6pt]
& \rho(C(2 \rightarrow mx), (\pi_{STAFF\_ID,\; MAX(cnt)} (GROUP\; BY\; STAFF\_ID\; (B)))) \\
\\[6pt]
& \rho(D, ((C) \; \bowtie_{C.mx = B.cnt \; \wedge \; C.STAFF\_ID = B.STAFF\_ID} (B))) \\
\\[6pt]
& \rho(E(3 \rightarrow PatientName), (Patient) \; \bowtie_{Patient.IID = D.IID} (D)) \\
\\[6pt]
& \pi_{STAFF\_ID,\; FullName,\; IID,\; PatientName} (E \; \bowtie \; Staff)
\end{alignedat}
```



### 15. List patients who had at least 3 emergency admissions during the year 2024

```math
\begin{aligned}
& \rho(A, \; \sigma_{Year(Date) = 2024} ((ClinicalActivity) \; \bowtie_{CAID} \; (Emergency))) \\
\\[6pt]
& \rho(B(2 \rightarrow cnt), \; \pi_{IID,\; count(*)} (GROUP\; BY\; IID\; (A))) \\
\\[6pt]
& \rho(C, \; \sigma_{cnt \geq 3} (B)) \\
\\[6pt]
& \rho(D, \; C \; \bowtie_{IID} \; (Patient)) \\
\\[6pt]
& \pi_{IID,\; CIN,\; FullName,\; Birth} (D)
\end{aligned}
```
