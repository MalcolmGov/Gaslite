"""Tiny calculator module used by the harness smoke test."""


def add(a, b):
    return a + b


def subtract(a, b):
    return a + b  # BUG: should subtract


def multiply(a, b):
    return a * b
