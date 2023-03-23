import { useEffect, useState } from "react";
import { AdData } from "../../../Data/Ads/AdData";
import { LocalData } from "../../../Data/LocalData";
import styles from "./StatsElement.module.css";

interface StatsFormProps {
  ad?: AdData;
}

const MSINDAY = 86400000; // Millisekunder i en dag, brukes for å regne ut antall dager imellom to datoer

export const StatsElement = (props: StatsFormProps) => {
  const [currentRentedCount, setCurrentRentedCount] = useState(0);
  const [futureRentedCount, setFutureRentedCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [image, setImage] = useState("");
  const [adLink, setAdLink] = useState("");

  useEffect(() => {
    setAdLink(`/ad/${props.ad?.id}`);

    // Laster inn bilder for annonsen, og lagrer bildet som skal vises i en state
    props.ad?.loadImages().then((ad) => {
      setImage(ad.loadedImages[0]);
    });
  }, [props.ad]);
  
  useEffect(() => {

    /**
     * Calcualtes the current amount of times the ad has been a part of a loan agreement
     * and the total earnings the ad has brought in as of today.
     * 
     * @params none
     * @returns void
     */
    async function calculateStats() {
      let allRentedCount = 0;
      const pricePerDay = props.ad!.price; // Enhver annonse må ha en pris, derfor kan man bruke '!' her
      // Laster inn alle låneavtalen denne annonsen inngår i
      const loanAgreements = (await LocalData.loanAgreements.loadDocuments()).documents.filter(
        (loanAgreement) => loanAgreement.ad?.id === props.ad?.id
      );
      allRentedCount = loanAgreements.length;

      let totalEarnings = 0;
      let currentRentedCount = 0;
      // For hver låneavtale, regn ut inntjening og legg til i totalen
      loanAgreements.forEach((loanAgreement) => {
        let days = 0;
        // Regner ut antall dager i låneavtalen som skal telles med
        if (loanAgreement.dateFrom > new Date()) { // Hele låneavtalen er i fremtiden, ikke legg til inntjening
          return;
        } else if (loanAgreement.dateFrom <= new Date() && loanAgreement.dateTo > new Date()) { // Deler av låneavtalen er i fortiden, legg til inntjening opp til i dag
          days = Math.ceil((new Date().getTime() - loanAgreement.dateFrom.getTime()) / MSINDAY)
        } else { // Hele låneavtalen er i fortiden, legg til inntjening for hele perioden
          days = Math.ceil((loanAgreement.dateTo.getTime() - loanAgreement.dateFrom.getTime()) / MSINDAY)
        }
        totalEarnings += pricePerDay * days;
        currentRentedCount++;
      });
      const futureRentedCount = allRentedCount  - currentRentedCount;

      setTotalEarnings(totalEarnings);
      setCurrentRentedCount(currentRentedCount);
      setFutureRentedCount(futureRentedCount);
    };
    calculateStats();
  }, [props.ad, props.ad?.id, props.ad?.price]);
  
  return (
    <div id={styles.statsElement}>
      <a className={styles.link} href={adLink} style={{ textDecoration: "none" }}>
        <div className={styles.infoSection}>
          <h3>{props.ad?.title}</h3>
          <div className={styles.imageSection}>
            <img src={image} alt="Bilde av annonsen"/>
          </div>
        </div>
      </a>
      <div className={styles.statsSection}>
        <ul className={styles.statsList}>
          <li>
            <div className={styles.rentedStats}>
              <div className={styles.rentedStat}>
                <h4>Låneavtaler til nå</h4>
                <h3>{currentRentedCount}</h3>
              </div>
              <div id={styles.vl}></div>
              <div className={styles.rentedStat}>
                <h4>Fremtidige låneavtaler</h4>
                <h3>{futureRentedCount}</h3>
              </div>
            </div>
          </li>
          <hr></hr>
          <li>
            <h4>Total inntjening så langt</h4>
            <h3>{totalEarnings} kr</h3>
          </li>
          <hr></hr>
          <li>
              <h4>Lagt til som favoritt</h4>
            {/* TODO: Legg inn funksjonalitet for å se antall favoritter her */}
          </li>
        </ul>
      </div>
    </div>
  );

}



