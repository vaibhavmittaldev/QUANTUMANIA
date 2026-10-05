"""
QUANTUMANIA Multi-Framework Simulation Subsystem
Provides adapters for Qiskit Aer, Cirq, PennyLane, and Local Statevector execution.
"""

from .engine import simulation_engine

__all__ = ["simulation_engine"]
