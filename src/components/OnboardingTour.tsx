"use client";

import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useLocalStorage } from "react-use";

export function OnboardingTour() {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage("pgm_tour_completed", false);
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only run if not completed yet and we are in the browser
    if (!hasCompletedTour && typeof window !== 'undefined') {
      // Slight delay to let the UI finish rendering
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      content: (
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">Bienvenue sur PGM ! 🚀</h2>
          <p className="text-slate-600 text-sm">Commençons cette courte visite guidée pour vous aider à prendre en main votre nouvel espace de pilotage de tournées et gestion RH en 2 minutes chrono.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: "#tour-nav-direction",
      placement: "right",
      content: (
        <div className="text-sm">
           <strong>C'est votre tableau de bord stratégique.</strong>
           <br />Suivez en temps réel le nombre de tournées actives, la rémunération des chauffeurs, et les alertes (absences, RH, retards).
        </div>
      )
    },
    {
      target: "#tour-nav-rh",
      placement: "right",
      content: (
        <div className="text-sm">
           <strong>L'espace Ressources Humaines.</strong>
           <br />C'est d'ici que vous allez référencer vos chauffeurs, renseigner leur coût journalier et tracer leurs documents (CDI, congés, etc.). Indispensable pour notre calcul de rentabilité !
        </div>
      )
    },
    {
      target: "#tour-nav-exploitation---flotte",
      placement: "right",
      content: (
        <div className="text-sm">
           <strong>Le cœur du réacteur ⚙️</strong>
           <br />Créez ici vos plannings, affectez vos chauffeurs et vos camions, et la plateforme fera mathématiquement le reste pour calculer le chiffre d'affaires.
        </div>
      )
    },
    {
      target: "#tour-nav-abonnement",
      placement: "right",
      content: (
        <div className="text-sm">
           <strong>Votre Offre SaaS</strong>
           <br />Surveillez le niveau de votre abonnement ou évoluez pour rajouter davantage de ressources et de chauffeurs dans l'application limite plafond. C'est terminé, à vous de jouer !
        </div>
      )
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setHasCompletedTour(true);
      setRun(false);
    }
  };

  // Prevent hydration mismatch
  if (!mounted || hasCompletedTour) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#ea580c', // orange-600
          textColor: '#334155',    // slate-700
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#ea580c',
          borderRadius: 6,
        },
        buttonBack: {
          marginRight: 10,
        },
        buttonSkip: {
          color: '#94a3b8',
        }
      }}
      locale={{
        back: "Précédent",
        close: "Fermer",
        last: "C'est parti !",
        next: "Suivant",
        skip: "Passer le tutoriel",
      }}
    />
  );
}
