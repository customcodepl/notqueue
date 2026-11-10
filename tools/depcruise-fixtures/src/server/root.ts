// Allowed: the composition root imports every layer.
import { api } from "../api/app";
import { useCase } from "../application/use-case";
import { now } from "../core/clock";
import { db } from "../infra/db";

export const root = [api, useCase, now, db];
